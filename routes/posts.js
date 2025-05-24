const express = require('express');
const router = express.Router();
const Post = require('../models/post');
const Notification = require('../models/notification');
const {isLoggedIn}=require('../middleware/auth');
const multer = require('multer');
const { storage, cloudinary } = require("../cloudConfig");
const upload = multer({ storage });

// Create Post
router.post('/', isLoggedIn, upload.single('image'), async (req, res) => {
    try {
        const { caption } = req.body;
        
        // Create new post with Cloudinary data if image was uploaded
        const newPost = new Post({
            user: req.user._id,
            caption,
            ...(req.file && {
                imageUrl: req.file.path,
                cloudinaryId: req.file.filename
            })
        });

        await newPost.save();
        
        res.status(201).json({
            success: true,
            post: newPost
        });
    } catch (err) {
        console.error('Error creating post:', err);
        
        // If there was an error and an image was uploaded, delete it from Cloudinary
        if (req.file) {
            await cloudinary.uploader.destroy(req.file.filename);
        }
        
        res.status(500).json({ 
            success: false,
            error: 'Failed to create post'
        });
    }
});

// Get all posts
router.get('/posts', async (req, res) => {
    const posts = await Post.find({})
        .populate('user', 'username profilePhoto')
        .populate('comments.user', 'username profilePhoto')
        .populate('comments.likes.user', 'username profilePhoto')
        .populate('comments.replies.user', 'username profilePhoto')
        .populate('comments.replies.likes.user', 'username profilePhoto')
        .sort({ createdAt: -1 })
        .lean();
    res.render('listing/main', { posts, currUser: req.user });
});

// Get comments for a post
// In your routes/posts.js
router.get('/:postId/comments', async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId)
            .populate('user', '_id username')
            .populate('user', 'username profilePhoto') // Include post user info
            .populate('comments.user', 'username profilePhoto')
            .populate('comments.likes.user', 'username profilePhoto')
            .populate('comments.replies.user', 'username profilePhoto')
            .populate('comments.replies.likes.user', 'username profilePhoto')
            .lean();

        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        // Return both post and comments in the response
        res.json({ 
            post: {
                _id: post._id,
                user: post.user
            },
            comments: post.comments || [] // Ensure comments is always an array
        });
    } catch (err) {
        console.error('Error fetching comments:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


// Add comment to post
router.post('/:postId/comments', isLoggedIn, async (req, res) => {
    try {
        const { text } = req.body;
        const post = await Post.findById(req.params.postId).populate('user');
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        post.comments.push({
            user: req.user._id,
            text
        });

        await post.save();
        
        const updatedPost = await Post.findById(req.params.postId)
            .populate('comments.user', 'username profilePhoto');

        const newComment = updatedPost.comments[updatedPost.comments.length - 1];

        // Create notification only if the post owner is not the one commenting
        if (!post.user._id.equals(req.user._id)) {
            await Notification.create({
                recipient: post.user._id,
                sender: req.user._id,
                type: 'comment',
                isRead: false,
                message: `${req.user.username} commented on your post: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`,
                relatedPost: post._id,
                relatedComment: newComment._id
            });
        }

        res.json({
            success: true,
            comment: newComment
        });
    } catch (err) {
        console.error('Error adding comment:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// Like a comment
router.post('/:postId/comments/:commentId/like', isLoggedIn, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId)
            .populate('comments.user');
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const comment = post.comments.id(req.params.commentId);
        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        const alreadyLiked = comment.likes.some(like => like.user.equals(req.user._id));
        
        if (alreadyLiked) {
            comment.likes = comment.likes.filter(like => !like.user.equals(req.user._id));
        } else {
            comment.likes.push({ user: req.user._id });
            
            // Create notification only if the comment owner is not the one liking
            if (!comment.user._id.equals(req.user._id)) {
                await Notification.create({
                    recipient: comment.user._id,
                    sender: req.user._id,
                    type: 'like',
                    isRead: false,
                    message: `${req.user.username} liked your comment`,
                    relatedPost: post._id,
                    relatedComment: comment._id
                });
            }
        }

        await post.save();
        
        res.json({ 
            success: true,
            likesCount: comment.likes.length,
            isLiked: !alreadyLiked
        });
    } catch (err) {
        console.error('Error liking comment:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


// Reply to comment
router.post('/:postId/comments/:commentId/replies', isLoggedIn, async (req, res) => {
    try {
        const { text } = req.body;
        const post = await Post.findById(req.params.postId)
            .populate('comments.user');
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const comment = post.comments.id(req.params.commentId);
        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        comment.replies.push({
            user: req.user._id,
            text
        });

        await post.save();
        
        const updatedPost = await Post.findById(req.params.postId)
            .populate('comments.replies.user', 'username profilePhoto');

        const updatedComment = updatedPost.comments.id(req.params.commentId);
        const newReply = updatedComment.replies[updatedComment.replies.length - 1];

        // Create notification for the comment owner if it's not the same user
        if (!comment.user._id.equals(req.user._id)) {
            await Notification.create({
                recipient: comment.user._id,
                sender: req.user._id,
                type: 'reply',
                isRead: false,
                message: `${req.user.username} replied to your comment`,
                relatedPost: post._id,
                relatedComment: comment._id,
                relatedReply: newReply._id
            });
        }

        res.json({
            success: true,
            reply: newReply
        });
    } catch (err) {
        console.error('Error adding reply:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


// Like a post
router.post('/:postId/like', isLoggedIn, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId).populate('user');
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const alreadyLiked = post.likes.some(like => like.user.equals(req.user._id));
        
        if (alreadyLiked) {
            post.likes = post.likes.filter(like => !like.user.equals(req.user._id));
        } else {
            post.likes.push({ user: req.user._id });
            
            // Create notification only if the post owner is not the one liking
            if (!post.user._id.equals(req.user._id)) {
                await Notification.create({
                    recipient: post.user._id,
                    sender: req.user._id,
                    type: 'like',
                    isRead: false,
                    message: `${req.user.username} liked your post`,
                    relatedPost: post._id
                });
            }
        }

        await post.save();
        
        res.json({ 
            success: true,
            likesCount: post.likes.length,
            isLiked: !alreadyLiked
        });
    } catch (err) {
        console.error('Error liking post:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// In your routes file (e.g., routes/posts.js)
router.post('/:postId/comments/:commentId/replies/:replyId/like', isLoggedIn, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId)
            .populate('comments.replies.user');
        if (!post) return res.status(404).json({ error: 'Post not found' });
        
        const comment = post.comments.id(req.params.commentId);
        if (!comment) return res.status(404).json({ error: 'Comment not found' });
        
        const reply = comment.replies.id(req.params.replyId);
        if (!reply) return res.status(404).json({ error: 'Reply not found' });
        
        const likeIndex = reply.likes.findIndex(like => like.user.equals(req.user._id));
        
        if (likeIndex >= 0) {
            reply.likes.splice(likeIndex, 1);
        } else {
            reply.likes.push({ user: req.user._id });
            
            // Create notification only if the reply owner is not the one liking
            if (!reply.user._id.equals(req.user._id)) {
                await Notification.create({
                    recipient: reply.user._id,
                    sender: req.user._id,
                    type: 'like',
                    isRead: false,
                    message: `${req.user.username} liked your reply`,
                    relatedPost: post._id,
                    relatedComment: comment._id,
                    relatedReply: reply._id
                });
            }
        }
        
        await post.save();
        
        res.json({
            success: true,
            likesCount: reply.likes.length,
            isLiked: likeIndex < 0
        });
    } catch (error) {
        console.error('Error liking reply:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
router.delete('/:id', isLoggedIn, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        
        // Check if user is authorized to delete
        if (!post.user.equals(req.user._id)) {
            return res.status(403).json({ error: 'Not authorized' });
        }
        
        // Delete image from Cloudinary if exists
        if (post.cloudinaryId) {
            await cloudinary.uploader.destroy(post.cloudinaryId);
        }
        
        // Delete post from database
        await Post.findByIdAndDelete(req.params.id);
        
        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting post:', err);
        res.status(500).json({ error: 'Failed to delete post' });
    }
});
// In your routes/posts.js or similar
router.delete('/:postId/comments/:commentId', isLoggedIn, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const comment = post.comments.id(req.params.commentId);
        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        // Check if user is the comment author OR post owner
        if (!comment.user.equals(req.user._id) && !post.user.equals(req.user._id)) {
            return res.status(403).json({ error: 'Not authorized to delete this comment' });
        }

        // Remove the comment
        post.comments.pull(req.params.commentId);
        await post.save();

        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting comment:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.delete('/:postId/comments/:commentId/replies/:replyId', isLoggedIn, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const comment = post.comments.id(req.params.commentId);
        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        const reply = comment.replies.id(req.params.replyId);
        if (!reply) {
            return res.status(404).json({ error: 'Reply not found' });
        }

        // Check if user is the reply author, comment author, or post owner
        if (!reply.user.equals(req.user._id) && 
            !comment.user.equals(req.user._id) && 
            !post.user.equals(req.user._id)) {
            return res.status(403).json({ error: 'Not authorized to delete this reply' });
        }

        // Remove the reply
        comment.replies.pull(req.params.replyId);
        await post.save();

        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting reply:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
module.exports = router;