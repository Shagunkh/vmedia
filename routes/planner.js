const express = require('express');
const router = express.Router();
const Planner = require('../models/Planner');

// GET Planner Page
router.get('/', async (req, res) => {
  const plans = await Planner.find({ user: req.user._id });
  res.render('planner', { plans });
});

// POST: Create Study Plan
// In your route file
// Updated route handler with breaks
// Updated route handler with proper time formatting
// Updated route handler
router.post('/create', async (req, res) => {
  try {
    const { startDate, endDate, dailyHours, subjects } = req.body;
    
    // Convert dates to Date objects
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    
    // Calculate total days
    const timeDiff = endDateObj - startDateObj;
    const totalDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
    
    // Calculate total available hours
    const totalHours = totalDays * dailyHours;
    
    // Calculate total difficulty points
    const totalDifficulty = subjects.reduce((sum, subj) => sum + parseInt(subj.difficulty), 0);
    
    // Allocate hours based on difficulty
    const subjectAllocations = subjects.map(subj => {
      const difficulty = parseInt(subj.difficulty);
      const percentage = (difficulty / totalDifficulty) * 100;
      const hours = Math.round((difficulty / totalDifficulty) * totalHours);
      
      return {
        name: subj.name,
        topic: subj.topic,
        difficulty,
        hours,
        percentage: percentage.toFixed(1)
      };
    });
    
    // Generate daily schedule with breaks
    const dailySchedules = [];
    let currentDate = new Date(startDateObj);
    
    // Helper function to format time properly
    const formatTime = (decimalHours) => {
      const hours = Math.floor(decimalHours);
      const minutes = Math.floor((decimalHours % 1) * 60);
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };
    
    for (let day = 0; day < totalDays; day++) {
      const daySessions = [];
      let hoursUsed = 0;
      let subjectIndex = 0;
      let remainingHours = [...subjectAllocations.map(s => s.hours)];
      
      while (hoursUsed < dailyHours && remainingHours.some(h => h > 0)) {
        const subject = subjectAllocations[subjectIndex % subjectAllocations.length];
        
        if (remainingHours[subjectIndex % subjectAllocations.length] > 0) {
          // Add study session (45-90 minute blocks)
          const sessionDuration = Math.min(
            Math.max(0.75, Math.random() * 1.5 + 0.75), // 45-90 minutes
            dailyHours - hoursUsed,
            remainingHours[subjectIndex % subjectAllocations.length]
          );
          
          const startHour = 9 + hoursUsed;
          const endHour = startHour + sessionDuration;
          
          daySessions.push({
            type: 'study',
            subject: subject.name,
            topic: subject.topic,
            duration: sessionDuration.toFixed(2),
            startTime: formatTime(startHour),
            endTime: formatTime(endHour)
          });
          
          hoursUsed += sessionDuration;
          remainingHours[subjectIndex % subjectAllocations.length] -= sessionDuration;
          
          // Add break (15-30 minutes) if there's time left
          if (hoursUsed < dailyHours && Math.random() > 0.3) {
            const breakDuration = Math.min(
              Math.max(0.25, Math.random() * 0.25 + 0.25), // 15-30 minutes
              dailyHours - hoursUsed
            );
            
            const breakStart = 9 + hoursUsed;
            const breakEnd = breakStart + breakDuration;
            
            daySessions.push({
              type: 'break',
              description: ['Short break', 'Coffee break', 'Quick rest', 'Stretch break'][Math.floor(Math.random() * 4)],
              duration: breakDuration.toFixed(2),
              startTime: formatTime(breakStart),
              endTime: formatTime(breakEnd)
            });
            
            hoursUsed += breakDuration;
          }
        }
        
        subjectIndex++;
      }
      
      dailySchedules.push({
        date: new Date(currentDate),
        sessions: daySessions
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    const plan = {
      startDate: startDateObj,
      endDate: endDateObj,
      dailyHours: parseInt(dailyHours),
      totalHours,
      totalDays,
      subjectAllocations,
      dailySchedules,
      createdAt: new Date()
    };
    
    res.render('planner', { plans: [plan] });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error generating plan');
  }
});

// POST: Update Session Status
router.post('/update/:id', async (req, res) => {
  const plan = await Planner.findById(req.params.id);
  if (!plan) return res.status(404).send('Plan not found');

  const { sessionIndex, status } = req.body;
  plan.sessions[sessionIndex].status = status;
  await plan.save();
  res.redirect('/planner');
});

router.post('/delete/:id', async (req, res) => {
  try {
    await Planner.findByIdAndDelete(req.params.id);
    res.redirect('/planner'); // or wherever your planner page is
  } catch (err) {
    res.status(500).send("Error deleting plan");
  }
});

module.exports = router;