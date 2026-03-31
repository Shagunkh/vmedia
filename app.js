if(process.env.NODE_ENV != "production"){
    require("dotenv").config();
};

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require("express-session");
const MongoStore = require('connect-mongo');
const socketIo = require('socket.io');
const flash = require('connect-flash');
const User = require('./models/user.js');
const Message = require('./models/message.js');
const Post = require('./models/post.js');
const Notification = require('./models/notification.js');
const Task = require('./models/task.js');
const Confession = require('./models/Confession.js');
const CollabRequest = require('./models/CollabRequest.js');
const CollabMessage = require('./models/CollabMessage.js');
const Faculty = require('./models/Faculty.js');
const FacultyReview = require('./models/FacultyReview');
const pyq = require('./models/pyq.js');
const LostItem = require('./models/FoundItem.js');
const FoundItem = require('./models/FoundItem.js');
const RandomChat = require('./models/RandomChat.js');
const GroupChat = require('./models/GroupChat.js');
const Product = require('./models/Product');
const Transaction = require('./models/Transaction');
const ChatMessage = require('./models/ChatMessage');

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
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

const dbUrl = process.env.ATLASDB_URL;

mongoose.connect(dbUrl)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.log('❌ MongoDB Error:', err));

const store = MongoStore.create({
  mongoUrl: dbUrl,
  crypto: {
    secret: process.env.SECRET,
  },
  touchAfter: 24 * 3600,
});

store.on("error", () => {
  console.log("Error in mongo session store", err);
});

const sessionOptions = {
  store,
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  },
};

app.use(session(sessionOptions));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.info = req.flash('info');
  next();
});

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

app.use("/users", userRouter);
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
app.use('/cgpa', cgpaRoutes);
const plannerRoutes = require('./routes/tasks');
app.use('/tasks', plannerRoutes);
app.use('/confessions', require('./routes/confessions'));
const CollabRouter = require('./routes/collab.js');
app.use('/collab', CollabRouter);
const CollabMessageRouter = require('./routes/CollabMessage.js');
app.use('/collabmessage', CollabMessageRouter);
const FacultyReviewRouter = require('./routes/facultyRoutes.js');
app.use('/faculty', FacultyReviewRouter);

const ffcsrouter = require('./routes/ffcs');
app.use('/ffcs', ffcsrouter);
const pyqrouter = require('./routes/pyq.js');
app.use('/api/pyq', pyqrouter);
const home = require('./routes/home.js');
app.use('/home', home);
const Lost = require('./routes/lostAndFound.js');
app.use('/lost-and-found', Lost);
const about = require('./routes/aboutus.js');
app.use('/aboutus', about);
const quiz = require('./routes/quiz.js');
app.use('/quiz', quiz);
const randomchatrouter = require('./routes/randomChat.js');
app.use('/random-chat', randomchatrouter);
const roomRoutes = require('./routes/roomRoutes');
app.use('/api/rooms', roomRoutes);
const apii = require('./routes/api.js');
app.use('/api', apii);
const appi = require('./routes/apii.js');
app.use('/apii', appi);
const addDropRoutes = require('./routes/addDrop');
app.use('/add-drop', addDropRoutes);

const { startDealScheduler } = require('./utils/dealScheduler');
startDealScheduler(); 
const marketplaceRoutes = require('./routes/marketplaceController');
app.use('/marketplace', marketplaceRoutes);
const nightMessRoutes = require('./routes/nightMess');
app.use('/nightmess', nightMessRoutes);
const vrideRoutes = require('./routes/vride');
app.use('/vride', vrideRoutes);

const notificationRoutes = require('./routes/notifications');
app.use('/notifications', notificationRoutes);

app.get('/', async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      const posts = await Post.find({})
        .sort({ createdAt: -1 })
        .populate('user')
        .lean();

      res.render('listing/main', { posts, currUser: req.user });
    } catch (err) {
      res.status(500).send('Error loading posts');
    }
  } else {
    res.redirect('/home');
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).render('error', {
    message: err.message,
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// ============ SOCKET.IO SETUP - FIXED VERSION ============
const server = require('http').createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Store connected users
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('🔵 New client connected:', socket.id);
  
  // ============ USER REGISTRATION ============
  socket.on('register-user', (userId) => {
    if (userId) {
      connectedUsers.set(userId, socket.id);
      socket.userId = userId;
      socket.join(`user_${userId}`);
      console.log(`✅ User ${userId} registered, total users: ${connectedUsers.size}`);
      socket.emit('registered', { success: true, userId });
    }
  });
  
  // ============ JOIN CHAT ROOM ============
  socket.on('join-chat-room', (roomId) => {
    if (roomId) {
      socket.join(roomId);
      console.log(`📢 Socket ${socket.id} joined room: ${roomId}`);
      socket.emit('room-joined', { roomId, success: true });
    }
  });
  
  // ============ LEAVE CHAT ROOM ============
  socket.on('leave-chat-room', (roomId) => {
    if (roomId) {
      socket.leave(roomId);
      console.log(`👋 Socket ${socket.id} left room: ${roomId}`);
    }
  });
  
  // ============ REAL-TIME MESSAGE RELAY (ONLY ONE HANDLER) ============
  socket.on('send-chat-message', (data) => {
    const { roomId, message, sender, productId, productTitle, receiverId, messageId, timestamp } = data;
    
    console.log(`💬 Relay message to room ${roomId} from ${sender.username}: ${message.substring(0, 30)}`);
    
    // Broadcast to everyone in the room EXCEPT sender
    socket.to(roomId).emit('receive-chat-message', {
      _id: messageId,
      message,
      sender,
      receiverId,
      productId,
      productTitle,
      createdAt: timestamp || new Date(),
      roomId
    });
    
    // Also send notification to receiver
    if (receiverId && connectedUsers.has(receiverId)) {
      io.to(`user_${receiverId}`).emit('chat-notification', {
        productId,
        productTitle,
        message: message.substring(0, 50),
        roomId,
        sender: sender.username,
        timestamp: new Date(),
        messageId
      });
    }
  });
  
  // ============ TYPING INDICATORS ============
  socket.on('typing-start', (data) => {
    const { roomId, username } = data;
    socket.to(roomId).emit('user-typing', {
      username,
      isTyping: true,
      roomId
    });
  });
  
  socket.on('typing-stop', (data) => {
    const { roomId, username } = data;
    socket.to(roomId).emit('user-typing', {
      username,
      isTyping: false,
      roomId
    });
  });
  
  // ============ ADD/DROP ROOM ============
  socket.on('joinAddDropRoom', (roomId) => {
    socket.join(roomId);
    console.log(`User joined add-drop room: ${roomId}`);
  });
  
  socket.on('addDropMessage', (data) => {
    io.to(data.roomId).emit('addDropMessage', {
      roomId: data.roomId,
      message: data.message
    });
  });
  
  // ============ NOTIFICATIONS ============
  socket.on('joinNotifications', (userId) => {
    socket.join(`notifications_${userId}`);
    console.log(`User ${userId} joined notifications room`);
  });
  
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
  
  socket.on('sendNotification', (notification) => {
    io.emit('newNotification', notification);
  });
  
  // ============ RANDOM CHAT ============
  socket.on('joinRandomChat', (chatId) => {
    socket.join(chatId);
    console.log(`User joined random chat room: ${chatId}`);
  });
  
  // ============ GENERAL CHAT MESSAGES ============
  socket.on('newMessage', async ({ username, text }) => {
    const message = await Message.create({ username, text, room: 'general' });
    io.emit('messageBroadcast', message);
  });
  
  socket.on('joinRoom', ({ projectId }) => {
    socket.join(projectId);
    console.log(`User joined project room: ${projectId}`);
  });
  
  // ============ DISCONNECT ============
  socket.on('disconnect', () => {
    if (socket.userId) {
      connectedUsers.delete(socket.userId);
      console.log(`🔴 User ${socket.userId} disconnected, remaining: ${connectedUsers.size}`);
    }
    console.log('Client disconnected:', socket.id);
  });
});

// Make io available in routes
app.set('io', io);
app.set('socketio', io);
app.getIO = () => io;

console.log('✅ Socket.io server initialized');
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});