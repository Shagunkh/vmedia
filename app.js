if(process.env.NODE_ENV != "production"){
    require("dotenv").config();
};

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require("express-session");
const MongoStore = require('connect-mongo');
const socketIo = require('socket.io');
const User = require('./models/user.js');
const Message = require('./models/message.js');
const Post = require('./models/post.js');
const Notification = require('./models/notification.js');
const Task = require('./models/task.js');
const Confession = require('./models/Confession.js');
const CollabRequest = require('./models/CollabRequest.js');
const CollabMessage=require('./models/CollabMessage.js');
const Faculty = require('./models/Faculty.js');
const FacultyReview = require('./models/FacultyReview');
const pyq = require('./models/pyq.js');
const LostItem= require('./models/FoundItem.js');
const FoundItem=require('./models/FoundItem.js');
const RandomChat = require('./models/RandomChat.js');
const GroupChat = require('./models/GroupChat.js');


const app = express();
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const expressLayouts = require('express-ejs-layouts');
const passport = require("passport");
const localStrategy = require("passport-local");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const userRouter = require("./routes/user.js");
const chatRoutes = require("./routes/chat.js");


const fetchNotifications = require('./middleware/fetchNotifications');
app.use(fetchNotifications);

const PORT = 4000;


app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");



app.use(methodOverride("_method"));

app.engine('ejs',ejsMate);
app.use(express.static(path.join(__dirname,"/public")));

const dbUrl = process.env.ATLASDB_URL;


mongoose.connect(dbUrl)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.log('❌ MongoDB Error:', err));



  const store = MongoStore.create({
  mongoUrl : dbUrl,
  crypto:{
    secret: process.env.SECRET,


  },
  touchAfter: 24*3600,
});

store.on("error",()=>{
  console.log("Error in mongo session store",err);
});
  const sessionOptions = {
     store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now()+7*24*60*60*1000,
        maxAge: 7*24*60*60*1000,
        httpOnly: true,
    },
};


app.use(session(sessionOptions));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



app.use(async (req, res, next) => {
  res.locals.currUser = req.user;

  if (req.user) {
    const Notification = require('./models/notification');
    try {
      const notifications = await Notification.find({
        recipient: req.user._id,
        isRead: false
      }).sort({ createdAt: -1 }).lean();

      res.locals.notifications = notifications;
    } catch (err) {
      console.error('Error fetching notifications:', err);
      res.locals.notifications = [];
    }
  } else {
    res.locals.notifications = [];
  }

  next();
});


app.use("/users",userRouter);
// app.all("*",(req,res,next)=>{
//     next(new ExpressError(404,"Page Not Found!"));
// });
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  next();
});

app.use("/chat", chatRoutes);
const postRoutes = require('./routes/posts');
app.use('/posts', postRoutes);
const profileRoutes = require('./routes/profile');
app.use('/profile', profileRoutes);
const cgpaRoutes = require('./routes/cgpa');
app.use('/cgpa', cgpaRoutes); // this maps '/cgpa' to the cgpa.js route
const plannerRoutes = require('./routes/tasks');
app.use('/tasks', plannerRoutes);
app.use('/confessions', require('./routes/confessions'));
const CollabRouter = require('./routes/collab.js');
app.use('/collab',CollabRouter);
const CollabMessageRouter = require('./routes/CollabMessage.js');
app.use('/collabmessage',CollabMessageRouter);
const FacultyReviewRouter= require('./routes/facultyRoutes.js');
app.use('/faculty',FacultyReviewRouter);

const ffcsrouter = require('./routes/ffcs');
app.use('/ffcs', ffcsrouter); 
const pyqrouter = require('./routes/pyq.js');
app.use('/api/pyq', pyqrouter);
const home = require('./routes/home.js');
app.use('/home',home);
const Lost = require('./routes/lostAndFound.js');
app.use('/lost-and-found',Lost);
const about = require('./routes/aboutus.js');
app.use('/aboutus',about);
const quiz = require('./routes/quiz.js');
app.use('/quiz',quiz);
const randomchatrouter = require('./routes/randomChat.js');
app.use('/random-chat',randomchatrouter);
// Add near your other route imports
const roomRoutes = require('./routes/roomRoutes');
app.use('/api/rooms', roomRoutes);
const apii=require('./routes/api.js');
app.use('/api',apii);
const appi = require('./routes/apii.js');
app.use('/apii',appi);
// app.js
// In app.js, replace your current middleware with:

const notificationRoutes = require('./routes/notifications');
app.use('/notifications', notificationRoutes);

app.get('/', async (req, res) => {
  try {
    const posts = await Post.find({})
      .sort({ createdAt: -1 })
      .populate('user') // fetches username, profilePhoto, etc.
      .lean();
      
    res.render('listing/main', { posts, currUser: req.user });
  } catch (err) {
    res.status(500).send('Error loading posts');
  }
});

  
// app.use((err,req,res,next)=>{
//     let {statusCode=500,message="Something went Wrong"}=err;
//     res.render("error.ejs",{message});
    
// });
// app._router.stack.forEach(r => {
//     if (r.route && r.route.path) {
//       console.log(`Registered route: ${r.route.path}`);
//     }
//   });
  
// In your main app file (app.js or server.js)
// Error handler middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  res.status(err.status || 500).render('error', {
    message: err.message,
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});
const server = require('http').createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Make io available in routes
app.set('io', io);

// Add this helper function
app.getIO = () => io;

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log('New client connected');

  // Join user's personal room
  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their room`);
  });

  // Handle random chat events
  socket.on('joinRandomChat', (chatId) => {
    socket.join(chatId);
    console.log(`User joined random chat room: ${chatId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});


// In your main server file (app.js or server.js)
// In your app.js after socket.io setup
// In app.js, update your Socket.IO setup:
io.on('connection', (socket) => {
  console.log('New client connected');
  
  // Join user's notification room
  socket.on('joinNotifications', (userId) => {
    socket.join(`notifications_${userId}`);
    console.log(`User ${userId} joined notifications room`);
  });
  
  // Handle mark as read events
  socket.on('markAsRead', (data) => {
    io.to(`notifications_${data.userId}`).emit('notificationRead', {
      notificationId: data.notificationId
    });
  });
  
  socket.on('markAllAsRead', (userId) => {
    io.to(`notifications_${userId}`).emit('notificationRead', {
      all: true
    });
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Helper function to send notifications
function sendNotification(io, notification) {
  io.to(`notifications_${notification.recipient}`).emit('newNotification', notification);
}

// Make io available in routes

io.on('connection', (socket) => {
  console.log('🟢 New client connected');

  socket.on('newMessage', async ({ username, text }) => {
    const message = await Message.create({ username, text, room: 'general' });
    io.emit('messageBroadcast', message);
  });

  // 🎯 Listen for notification trigger
  socket.on('sendNotification', (notification) => {
    // Optionally emit only to the recipient via socket ID if you implement user-socket mapping
    io.emit('newNotification', notification); 
  });

  socket.on('joinRoom', ({ projectId }) => {
    socket.join(projectId);
    console.log(`User joined project room: ${projectId}`);
  });

 
});


server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});



server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
