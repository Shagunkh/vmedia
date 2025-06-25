const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsyc.js");
const User = require("../models/user.js");
const passport = require("passport");
const Notification = require('../models/notification');
const { isLoggedIn } = require('../middleware/auth');
const Post = require('../models/post.js');

// Signup Routes
router.get("/signup", (req, res) => {
   res.render("users/signup.ejs");
});

const { sendWelcomeEmail } = require('../utils/email');

router.post("/signup", wrapAsync(async (req, res, next) => {
    try {
        let { username, email, password } = req.body;
        const newUser = new User({ email, username });
        const registeredUser = await User.register(newUser, password);
        
        // Send welcome email
        await sendWelcomeEmail(email, username);
        
        req.login(registeredUser, (err) => {
            if (err) return next(err);
            res.redirect("/users/complete-profile");
        });
    } catch (e) {
      
        res.redirect("/users/signup");
    }
}));
// Add this to your routes/users.js
router.get("/complete-profile", isLoggedIn, (req, res) => {
    // Check if user already completed profile
    if (req.user.gender && req.user.collegeYear) {
        return res.redirect("/");
    }
    res.render("users/completeProfile.ejs");
});

router.post("/complete-profile", isLoggedIn, wrapAsync(async (req, res) => {
    const { gender, collegeYear } = req.body;
    await User.findByIdAndUpdate(req.user._id, {
        gender,
        collegeYear
    });
    res.redirect("/");
}));
// Login Routes
router.get("/login", (req, res) => {
    res.render("users/login.ejs");
});

router.post("/login", passport.authenticate("local", {
    
    failureRedirect: '/users/login'
}), (req, res) => {
    const redirectUrl = res.locals.returnTo || '/';
    delete res.locals.returnTo;
    res.redirect(redirectUrl);
});

// Logout Route
router.get("/logout", (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        res.redirect("/");
    });
});


// Notification Route
router.post('/notifications/mark-read', isLoggedIn, wrapAsync(async (req, res) => {
    await Notification.updateMany(
        { recipient: req.user._id, isRead: false },
        { $set: { isRead: true } }
    );
    res.json({ success: true });
}));

router.get('/search', async (req, res) => {
    try {
        const searchQuery = req.query.q;
        if (!searchQuery) {
            return res.json([]);
        }

        const users = await User.find({
            username: { $regex: searchQuery, $options: 'i' }
        }).limit(10);

        res.json(users);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add this route for viewing other profiles
router.get('/:username', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username })
            .populate('followers', 'username profilePhoto')
            .populate('following', 'username profilePhoto');
            
        const posts = await Post.find({ user: user._id }).sort({ createdAt: -1 }).limit(10);
        
        if (!user) {
            throw new ExpressError('User not found', 404);
        }
        
        // Check if current user is logged in and following this user
        let canViewPrivate = false;
        if (req.user) {
            canViewPrivate = req.user.following.includes(user._id) || req.user._id.equals(user._id);
        }
        
        res.render('users/otherprofile', { 
            user, 
            posts: posts || [],
            currentUser: req.user, // Pass current user to template
            canViewPrivate
        });
    } catch (error) {
        console.error('Profile view error:', error);
        res.status(500).render('error', { error });
    }
});

router.post('/:userId/request-follow', isLoggedIn, wrapAsync(async (req, res) => {
    if (req.user._id.equals(req.params.userId)) {
        return res.status(400).json({ error: "You can't follow yourself" });
    }

    const targetUser = await User.findById(req.params.userId);
    
    // Check if already following
    if (req.user.following.includes(req.params.userId)) {
        return res.status(400).json({ error: "You're already following this user" });
    }

    // Check if request already sent
    if (req.user.sentFollowRequests.includes(req.params.userId)) {
        return res.status(400).json({ error: "Follow request already sent" });
    }

    // If approval not required, follow directly
    if (!targetUser.privacy.followApprovalRequired) {
        const [follower, following] = await Promise.all([
            User.findByIdAndUpdate(req.user._id, {
                $addToSet: { following: req.params.userId }
            }, { new: true }),
            
            User.findByIdAndUpdate(req.params.userId, {
                $addToSet: { followers: req.user._id }
            }, { new: true })
        ]);

        await Notification.create({
            recipient: req.params.userId,
            sender: req.user._id,
            type: 'follow',
            isRead: false,
            message: `${req.user.username} started following you`
        });

        return res.json({ success: true, follower, following });
    }

    // If approval required, send request
    await Promise.all([
        User.findByIdAndUpdate(req.user._id, {
            $addToSet: { sentFollowRequests: req.params.userId }
        }),
        
        User.findByIdAndUpdate(req.params.userId, {
            $addToSet: { followRequests: req.user._id }
        })
    ]);

    await Notification.create({
        recipient: req.params.userId,
        sender: req.user._id,
        type: 'follow-request',
        isRead: false,
        message: `${req.user.username} wants to follow you`
    });

    res.json({ success: true, requiresApproval: true });
}));

// Accept Follow Request
router.post('/:userId/accept-follow', isLoggedIn, wrapAsync(async (req, res) => {
    const [follower, following] = await Promise.all([
        User.findByIdAndUpdate(req.params.userId, {
            $addToSet: { following: req.user._id },
            $pull: { sentFollowRequests: req.user._id }
        }, { new: true }),
        
        User.findByIdAndUpdate(req.user._id, {
            $addToSet: { followers: req.params.userId },
            $pull: { followRequests: req.params.userId }
        }, { new: true })
    ]);

    await Notification.create({
        recipient: req.params.userId,
        sender: req.user._id,
        type: 'follow-accepted',
        isRead: false,
        message: `${req.user.username} accepted your follow request`
    });

    res.json({ success: true, follower, following });
}));

// Reject Follow Request
router.post('/:userId/reject-follow', isLoggedIn, wrapAsync(async (req, res) => {
    await Promise.all([
        User.findByIdAndUpdate(req.params.userId, {
            $pull: { sentFollowRequests: req.user._id }
        }),
        
        User.findByIdAndUpdate(req.user._id, {
            $pull: { followRequests: req.params.userId }
        })
    ]);

    res.json({ success: true });
}));

// Unfollow Route
router.delete('/:userId/follow', isLoggedIn, wrapAsync(async (req, res) => {
    const [follower, following] = await Promise.all([
        User.findByIdAndUpdate(req.user._id, {
            $pull: { following: req.params.userId }
        }, { new: true }),
        
        User.findByIdAndUpdate(req.params.userId, {
            $pull: { followers: req.user._id }
        }, { new: true })
    ]);

    res.json({ success: true, follower, following });
}));

module.exports = router;
