
const express = require('express');
const router = express.Router();
const VRide = require('../models/VRide');
const User = require('../models/user');
const { isLoggedIn } = require('../middleware/auth');
const { sendEmail } = require('../utils/emailll');
const ExpressError = require('../utils/ExpressError');
const wrapAsync = require('../utils/wrapAsyc');
// Main V-Ride Page with Integrated Search
// Main V-Ride Page with Integrated Search
// Helper function to normalize time format
const normalizeTime = (timeString) => {
  if (!timeString) return null;
  const [hours, minutes] = timeString.split(':').map(Number);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

// Main V-Ride Page with Integrated Search
router.get('/', wrapAsync(async (req, res) => {
    const { from, to, date, time, nearby } = req.query;
    
    let recentRides = [];
    let searchResults = [];
    let searchParams = { from, to, date, time, nearby };
    let isSearch = false;

    // If search parameters exist
    if (from || to || date) {
        isSearch = true;
        
        // Build the search query
        let query = { seatsAvailable: { $gt: 0 } };
        
        if (from) query.from = new RegExp(from, 'i');
        if (to) query.to = new RegExp(to, 'i');
        if (date) {
            const queryDate = new Date(date);
            queryDate.setHours(0, 0, 0, 0);
            const nextDay = new Date(queryDate);
            nextDay.setDate(queryDate.getDate() + 1);
            
            query.date = { $gte: queryDate, $lt: nextDay };
        }
        
        // First find all rides matching other criteria
        let results = await VRide.find(query).populate('creator');
        
        // Handle time filtering
        if (time) {
            const normalizedSearchTime = normalizeTime(time);
            const [hours, minutes] = time.split(':').map(Number);
            const requestedTime = hours * 60 + minutes;
            
            searchResults = results.filter(ride => {
                const normalizedRideTime = normalizeTime(ride.time);
                const [rideHours, rideMinutes] = normalizedRideTime.split(':').map(Number);
                const rideTime = rideHours * 60 + rideMinutes;
                
                if (nearby === 'true') {
                    return Math.abs(rideTime - requestedTime) <= 120; // 2 hour window
                } else {
                    return normalizedRideTime === normalizedSearchTime; // Exact match
                }
            });
        } else {
            searchResults = results;
        }
    }
    
    // Always get recent rides (for the "recent rides" section)
    recentRides = await VRide.find({ seatsAvailable: { $gt: 0 } })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('creator');
    
    res.render('vrideindex', { 
        recentRides,
        searchResults: isSearch ? searchResults : [],
        searchParams,
        isSearch,
        currentUser: req.user
    });
}));
// Create Ride Form
router.get('/new', isLoggedIn, (req, res) => {
    res.render('vridecreate');
});

// Create Ride
router.post('/', isLoggedIn, wrapAsync(async (req, res) => {
    const { from, to, date, time, totalSeats, totalFare, mobileNumber, whatsappNumber } = req.body;
    
    const seats = parseInt(totalSeats);
    const fare = parseInt(totalFare);
    const perPerson = Math.ceil(fare / seats);
    
    const ride = new VRide({
        creator: req.user._id,
        from,
        to,
        date: new Date(date),
        time,
        totalSeats: seats,
        seatsAvailable: seats,
        totalFare: fare,
        perPersonFare: perPerson,
        mobileNumber,
        whatsappNumber: whatsappNumber || mobileNumber
    });
    
    await ride.save();
    res.redirect('/vride');
}));

// Join Ride
router.post('/:id/join', isLoggedIn, wrapAsync(async (req, res) => {
    const { id } = req.params;
    const { mobileNumber } = req.body;
    
    if (!/^[0-9]{10}$/.test(mobileNumber)) {
        throw new ExpressError('Invalid mobile number format', 400);
    }

    const ride = await VRide.findById(id).populate('creator');
    if (!ride) {
        return res.redirect('/vride');
    }
    
    if (ride.seatsAvailable <= 0) {
        return res.redirect('/vride');
    }
    
    const alreadyJoined = ride.joinedUsers.some(j => j.user.equals(req.user._id));
    if (alreadyJoined) {
        return res.redirect('/vride');
    }
    
    ride.joinedUsers.push({
        user: req.user._id,
        mobileNumber
    });
    
    ride.seatsAvailable -= 1;
    await ride.save();
    
    try {
        if (process.env.EMAIL_USERNAME && process.env.EMAIL_PASSWORD) {
            const creatorEmail = ride.creator.email;
            const joinerEmail = req.user.email;
            
            await sendEmail({
                to: creatorEmail,
                subject: 'Someone joined your V-Ride!',
                text: `User ${req.user.username} (${mobileNumber}) has joined your ride from ${ride.from} to ${ride.to} on ${ride.date.toDateString()} at ${ride.time}.\n\nPer person fare: ₹${ride.perPersonFare}\n\nContact the user at: ${mobileNumber}`
            });
            
            await sendEmail({
                to: joinerEmail,
                subject: 'You joined a V-Ride!',
                text: `You've joined a ride from ${ride.from} to ${ride.to} on ${ride.date.toDateString()} at ${ride.time}.\n\nPer person fare: ₹${ride.perPersonFare}\n\nContact the ride creator at:\nMobile: ${ride.mobileNumber}\nWhatsApp: ${ride.whatsappNumber}`
            });
        }
    } catch (emailErr) {
        console.error('Email sending failed:', emailErr);
    }
    
    res.redirect('/vride');
}));

// Delete Ride
router.delete('/:id', isLoggedIn, wrapAsync(async (req, res) => {
    const { id } = req.params;
    
    const ride = await VRide.findById(id);
    if (!ride) {
     
        return res.redirect('/vride');
    }
    
    if (!ride.creator.equals(req.user._id)) {
      
        return res.redirect('/vride');
    }
    
    await VRide.findByIdAndDelete(id);
    
    res.redirect('/vride');
}));

module.exports = router;
