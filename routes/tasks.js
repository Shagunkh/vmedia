const express = require("express");
const router = express.Router();
const Task = require("../models/task");
const Exam = require("../models/exam");
const FocusSession = require("../models/focusSession");
const { isLoggedIn } = require("../middleware/auth");




router.get('/', isLoggedIn, (req, res) => {
    res.render('./tasks', { user: req.user });
});

// Get all tasks and exams for the current user
// Update the GET /api route in your backend
router.get("/api", isLoggedIn, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tasks = await Task.find({ 
      userId: req.user._id,
      isCompleted: false
    }).sort({ dueDate: 1 });
    
    const exams = await Exam.find({
      userId: req.user._id,
      examDate: { $gte: today }
    }).sort({ examDate: 1 });
    
    res.json({ 
      success: true,
      data: {
        tasks: tasks || [],
        exams: exams || []
      }
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching tasks'
    });
  }
});

// Other routes remain the same, just add the new /focus/current route
// ... [rest of your existing routes] ...


// Create a new task
router.post("/", isLoggedIn, async (req, res) => {
  const { title, subject, dueDate, time } = req.body;
  
  const task = new Task({
    userId: req.user._id,
    title,
    subject,
    dueDate: new Date(dueDate),
    time
  });
  
  await task.save();
  res.redirect("/profile")
});

// Update task completion status
router.patch("/:id/complete", isLoggedIn, async (req, res) => {
  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { isCompleted: true },
    { new: true }
  );
  
  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }
  
  res.json(task);
});

// Delete a task
router.delete("/:id", isLoggedIn, async (req, res) => {
  const task = await Task.findOneAndDelete({
    _id: req.params.id,
    userId: req.user._id
  });
  
  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }
  
  res.json({ success: true });
});

// Create a new exam
router.post("/exams", isLoggedIn, async (req, res) => {
  const { subject, examDate, slot } = req.body;
  
  const exam = new Exam({
    userId: req.user._id,
    subject,
    examDate: new Date(examDate),
    slot
  });
  
  await exam.save();
  res.status(201).json(exam);
});

// Delete an exam
router.delete("/exams/:id", isLoggedIn,async (req, res) => {
  const exam = await Exam.findOneAndDelete({
    _id: req.params.id,
    userId: req.user._id
  });
  
  if (!exam) {
    return res.status(404).json({ error: "Exam not found" });
  }
  
  res.json({ success: true });
});

// Start a focus session
router.post("/focus", isLoggedIn, async (req, res) => {
  const { duration } = req.body; // duration in minutes
  
  const session = new FocusSession({
    userId: req.user._id,
    duration
  });
  
  await session.save();
  res.status(201).json(session);
});
// Add this new route to get the current focus session
router.get("/focus/current", isLoggedIn, async (req, res) => {
  try {
    const session = await FocusSession.findOne({
      userId: req.user._id,
      completed: false
    }).sort({ startedAt: -1 });
    
    if (!session) {
      return res.status(404).json({ error: "No active focus session" });
    }
    
    res.json(session);
  } catch (error) {
    console.error('Error getting current focus session:', error);
    res.status(500).json({ error: "Server error" });
  }
});

// Update the existing PATCH endpoint
router.patch("/focus/current/end", isLoggedIn, async (req, res) => {
  try {
    // Find the most recent active session for this user
    const session = await FocusSession.findOneAndUpdate(
      { 
        userId: req.user._id,
        completed: false 
      },
      { 
        endedAt: new Date(), 
        completed: true 
      },
      { 
        new: true,
        sort: { startedAt: -1 } // Get the most recent session
      }
    );
    
    if (!session) {
      return res.status(404).json({ error: "No active focus session found" });
    }
    
    res.json(session);
  } catch (error) {
    console.error('Error ending focus session:', error);
    res.status(500).json({ error: "Server error" });
  }
});
// End a focus session
router.patch("/focus/:id/end", isLoggedIn, async (req, res) => {
  const session = await FocusSession.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { endedAt: new Date(), completed: true },
    { new: true }
  );
  
  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }
  
  res.json(session);
});

module.exports = router;