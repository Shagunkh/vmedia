# 🎓 VMedia — The All-in-One Campus Social Platform

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-v22.16.0-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-5.x-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-4.x-010101?style=for-the-badge&logo=socketdotio&logoColor=white)
![Cloudinary](https://img.shields.io/badge/Cloudinary-Media_CDN-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)
![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

**A feature-rich, real-time social and utility platform built exclusively for college students.**

[Features](#-features) · [Tech Stack](#-tech-stack) · [Architecture](#-architecture) · [Installation](#-installation) · [Environment Variables](#-environment-variables) · [API Routes](#-api-routes) · [Database Models](#-database-models)

</div>

---

## 📖 Overview

**VMedia** is a comprehensive, full-stack web application designed to serve as the digital backbone of college campus life. It integrates social networking, academic tools, a peer-to-peer marketplace, ride-sharing, and real-time communication into a single cohesive platform — purpose-built for students.

Built with a Node.js + Express backend, EJS templating engine, MongoDB Atlas as the database, and Socket.io for real-time bidirectional communication, VMedia handles everything from posting campus confessions to organizing carpools and selling used textbooks.

---

## ✨ Features

VMedia is organized into several interconnected feature modules:

### 👤 User Accounts & Profiles
- **Secure Registration & Login** via Passport.js with `passport-local-mongoose` strategy
- **Rich User Profiles** with profile photo (Cloudinary-hosted), bio, LinkedIn ID, college year, and gender
- **Follow / Unfollow System** with optional follow-request approval for private accounts
- **Privacy Controls** — toggle visibility of timetable and posts individually
- **Persistent sessions** stored in MongoDB via `connect-mongo` with 7-day cookie lifetime
- Flash notifications for success, error, and info messages

### 📰 Social Feed & Posts
- Create, edit, and delete campus posts with image uploads
- Chronological feed rendered from followed users
- Post likes, comments, and interaction tracking
- Real-time notification on social interactions

### 💬 Real-Time Chat (Socket.io)
- **Direct Messaging** between any two users using dedicated chat rooms
- **Typing Indicators** — live "User is typing..." feedback
- **Chat Notifications** sent to receivers even when not in the chat view
- **Marketplace Chat** — each product listing has its own chat room for buyer/seller negotiation
- **Group Chat Rooms** — multi-user rooms with join/leave events
- **Random Chat** — be paired with a random online student for anonymous conversation
- **Add-Drop Room Chat** — dedicated room for course add/drop coordination

### 🛒 VMall — Campus Marketplace
- List items for sale with multiple images (Cloudinary), price, category, and condition
- Categories: Books, Electronics, Furniture, Clothing, Stationery, Sports, Others
- Product conditions: New, Like New, Good, Fair, Poor
- **Product Search** using MongoDB full-text index on title, description, and tags
- **Deal Confirmation System** with buyer-locking and queuing logic:
  - Buyer confirms interest → deal is locked to that buyer
  - Seller confirms → deal status becomes `both_confirmed`, product marked `sold`
  - Other interested buyers are queued and notified if a deal falls through
  - Deals auto-expire with a 3-hour timer (`autoMarkSoldAt`)
- **Verified Purchase Reviews** — only actual buyers can leave verified reviews
- Review ratings, helpful votes, seller replies
- Deal status lifecycle: `pending → buyer_confirmed / seller_confirmed → both_confirmed → sold / expired`
- Deal Scheduler runs automated background jobs via `node-cron`
- Real-time chat between buyer and seller per product
- My Chats dashboard to view all ongoing product conversations

### 🚗 VRide — Ride Sharing
- Post ride offers with from/to locations, date, time, total seats (1–4), and fare
- Per-person fare auto-calculated from total fare ÷ total seats
- Students join available rides and share mobile/WhatsApp contact
- Browse active rides and filter by route/date

### 🍜 Night Mess
- Browse the night mess food menu with item details
- Add, edit, and delete menu items (admin/authorized users)
- Item detail pages with pricing and availability info

### 📚 PYQ — Previous Year Question Papers
- Upload and browse Previous Year Question Papers
- Organized by subject/course
- Files stored on Cloudinary (supports JPG, PNG, PDF)

### 🎓 CGPA Calculator
- Built-in CGPA/GPA calculator for students
- Supports custom grade inputs and credit hours

### 📅 FFCS — Timetable Builder
- Manual timetable creation and management
- Store timetable data in user profile
- Screenshot upload for timetable sharing with privacy controls

### ✅ Task Planner
- Personal to-do and task management
- Create, update, and delete academic tasks
- Focus session tracking

### 🤫 Confessions Board
- Anonymous confession submission
- Public listing of campus confessions (no identity revealed)

### 🤝 Collab — Project Collaboration
- Post collaboration requests for projects, research, or events
- Send/receive collaboration messages
- Browse open collaboration opportunities

### 👨‍🏫 Faculty Reviews
- Submit reviews for faculty members
- View aggregated faculty ratings and comments

### 🔍 Lost & Found
- Post lost or found items with description and image
- Browse lost/found items by other students

### 🎯 Quiz / Quizlet
- Built-in quiz platform for academic practice
- Browse and attempt subject-wise quizzes

### 🔔 Notifications System
- Real-time in-app notifications for follows, post interactions, marketplace activity, etc.
- Notification bell with unread count badge
- Mark individual or all notifications as read
- Persistent unread notifications fetched on every authenticated request via middleware

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Runtime** | Node.js v22.16.0 |
| **Framework** | Express.js v5.x |
| **Templating** | EJS + EJS-Mate (layouts) |
| **Database** | MongoDB Atlas via Mongoose v8 |
| **Authentication** | Passport.js + passport-local + passport-local-mongoose |
| **Sessions** | express-session + connect-mongo |
| **Real-time** | Socket.io v4 |
| **File Uploads** | Multer + multer-storage-cloudinary |
| **Media CDN** | Cloudinary |
| **Email** | Nodemailer |
| **Scheduling** | node-cron |
| **Validation** | express-validator |
| **Environment** | dotenv |
| **Deployment** | Vercel (`@vercel/node`) |

---

## 🏗 Architecture

```
vmedia-main/
├── app.js                  # Entry point: Express app, Mongoose, Passport, Socket.io
├── cloudConfig.js          # Cloudinary v2 config + Multer storage adapter
├── storageConfig.js        # Additional storage configurations
├── vercel.json             # Vercel deployment config (routes all traffic → app.js)
│
├── models/                 # Mongoose data models
│   ├── user.js             # User schema (auth, profile, social graph, privacy)
│   ├── post.js             # Social feed posts
│   ├── message.js          # General chat messages
│   ├── notification.js     # Notification schema
│   ├── task.js             # Task planner items
│   ├── Product.js          # Marketplace product (+ reviews, deal system)
│   ├── Transaction.js      # Completed marketplace transactions
│   ├── ChatMessage.js      # Per-room marketplace chat messages
│   ├── VRide.js            # Ride sharing posts
│   ├── NightMessFood.js    # Night mess menu items
│   ├── Confession.js       # Anonymous confessions
│   ├── CollabRequest.js    # Collaboration requests
│   ├── CollabMessage.js    # Collab messaging
│   ├── Faculty.js          # Faculty records
│   ├── FacultyReview.js    # Faculty reviews
│   ├── FoundItem.js        # Lost & Found items
│   ├── pyq.js              # PYQ paper metadata
│   ├── RandomChat.js       # Random chat pairing
│   ├── GroupChat.js        # Group chat rooms
│   ├── Room.js             # Study/discussion rooms
│   ├── AddDrop.js          # Add/drop course records
│   ├── Announcement.js     # Campus announcements
│   └── ...                 # Others (exam, focusSession, ViewCount, etc.)
│
├── routes/                 # Express route handlers
│   ├── user.js             # /users — registration, login, logout
│   ├── chat.js             # /chat — direct messaging
│   ├── posts.js            # /posts — social feed CRUD
│   ├── profile.js          # /profile — user profile management
│   ├── marketplaceController.js  # /marketplace — VMall full CRUD + deal system
│   ├── vride.js            # /vride — ride sharing
│   ├── nightMess.js        # /nightmess — night mess menu
│   ├── pyq.js              # /api/pyq — PYQ uploads
│   ├── cgpa.js             # /cgpa — CGPA calculator
│   ├── ffcs.js             # /ffcs — timetable builder
│   ├── tasks.js            # /tasks — task planner
│   ├── confessions.js      # /confessions — anonymous confessions
│   ├── collab.js           # /collab — collaboration board
│   ├── CollabMessage.js    # /collabmessage — collab messaging
│   ├── facultyRoutes.js    # /faculty — faculty reviews
│   ├── lostAndFound.js     # /lost-and-found — lost & found board
│   ├── randomChat.js       # /random-chat — random pairing
│   ├── roomRoutes.js       # /api/rooms — study rooms
│   ├── addDrop.js          # /add-drop — course swap requests
│   ├── notifications.js    # /notifications — notification management
│   ├── home.js             # /home — landing page
│   ├── aboutus.js          # /aboutus — about page
│   └── quiz.js             # /quiz — quiz module
│
├── middleware/
│   └── fetchNotifications.js  # Injects unread notification count globally
│
├── utils/
│   └── dealScheduler.js    # node-cron job for deal expiry & auto-mark-sold
│
├── views/                  # EJS templates (organized by feature)
│   ├── layouts/            # Base layout templates (EJS-Mate)
│   ├── partials/           # Reusable partials (header, footer, navbar)
│   ├── includes/           # Shared UI includes
│   ├── listing/            # Social feed views
│   ├── marketplace/        # VMall views (index, product-details, my-chats, etc.)
│   ├── nightmess/          # Night mess views
│   ├── vride/              # VRide views
│   ├── faculty/            # Faculty review views
│   ├── collab/             # Collab views
│   ├── ffcs/               # Timetable views
│   ├── paper/              # PYQ views
│   ├── quizlet/            # Quiz views
│   ├── home/               # Landing/home page views
│   ├── users/              # Login/register views
│   ├── notifications/      # Notification views
│   ├── profile.ejs         # User profile page
│   ├── tasks.ejs           # Task planner UI
│   ├── planner.ejs         # Study planner
│   ├── lost-and-found.ejs  # Lost & Found UI
│   └── ...
│
├── public/                 # Static assets (CSS, client-side JS, images)
├── scripts/                # Utility/email template scripts
│   └── inviteEmailTemplate.html
│
├── insert_fresh_fake.js    # Seeder: inserts fake product data
├── delete_fake_products.js # Cleaner: removes seeded fake products
├── cleanup_all_fake.js     # Full data cleanup script
└── update_with_local_images.js  # Utility: migrate local images to Cloudinary
```

---

## 🔄 Real-Time Events (Socket.io)

The Socket.io server runs on the same HTTP server as Express. The following events are handled:

| Event (Client → Server) | Description |
|---|---|
| `register-user` | Maps userId → socketId; joins personal notification room |
| `join-chat-room` | Joins a specific product/chat room |
| `leave-chat-room` | Leaves a room |
| `send-chat-message` | Relays a message to all other room members |
| `typing-start` / `typing-stop` | Broadcasts typing status in a room |
| `joinAddDropRoom` | Joins the add/drop coordination room |
| `addDropMessage` | Broadcasts a message in the add/drop room |
| `joinNotifications` | Joins the personal notifications room |
| `markAsRead` | Marks a specific notification as read |
| `markAllAsRead` | Marks all notifications as read |
| `sendNotification` | Broadcasts a notification globally |
| `joinRandomChat` | Joins a random chat pairing room |
| `newMessage` | Posts to the general chat room |
| `joinRoom` | Joins a project/study room |

| Event (Server → Client) | Description |
|---|---|
| `registered` | Confirms user socket registration |
| `room-joined` | Confirms room join |
| `receive-chat-message` | Delivers an incoming message |
| `chat-notification` | Popup notification for a new chat message |
| `user-typing` | Typing indicator broadcast |
| `addDropMessage` | Incoming add-drop room message |
| `notificationRead` | Confirms notification(s) mark as read |
| `newNotification` | A new notification pushed to client |
| `messageBroadcast` | General chat message broadcast |

---

## 🗄 Database Models

### User
| Field | Type | Description |
|---|---|---|
| `username` | String | Auto-managed by passport-local-mongoose |
| `password` | String | Hashed, managed by PLM |
| `email` | String | Required, unique |
| `profilePhoto` | String | Cloudinary URL |
| `bio` | String | Max 250 chars |
| `linkedinId` | String | Validated LinkedIn handle |
| `gender` | Enum | Male/Female/Other/Prefer not to say |
| `collegeYear` | Number | 1–4 |
| `following` / `followers` | [ObjectId] | Social graph refs |
| `followRequests` / `sentFollowRequests` | [ObjectId] | Pending follow requests |
| `privacy` | Object | showTimetable, showPosts, followApprovalRequired |
| `timetableManual` | Object | FFCS timetable data |
| `timetableScreenshot` | String | Uploaded timetable image |
| `roomsCreated` / `roomsJoined` | [ObjectId] | Study rooms |
| `groupChats` | [ObjectId] | Group chat memberships |
| `isAvailableForRandomChat` | Boolean | Opt-in for random pairing |

### Product (VMall)
| Field | Type | Description |
|---|---|---|
| `title`, `description` | String | Listing basics |
| `price` | Number | Min 0 |
| `category` | Enum | Books, Electronics, Furniture, etc. |
| `condition` | Enum | New → Poor |
| `images` | Array | `{url, public_id}` from Cloudinary |
| `seller` | ObjectId→User | Listing owner |
| `status` | Enum | available, sold, reserved, hidden, expired |
| `dealStatus` | Enum | pending → buyer_confirmed → seller_confirmed → both_confirmed → sold |
| `pendingDealWith` | ObjectId→User | Locked-in buyer for current deal |
| `queuedBuyers` | Array | Users queued while deal is locked |
| `dealConfirmations` | Array | Who confirmed the current deal |
| `autoMarkSoldAt` | Date | 3-hour auto-expire timestamp |
| `reviews` | Array | Embedded review subdocuments |
| `averageRating` / `totalReviews` | Number | Auto-calculated stats |
| `chatRooms` | Array | Per-user chat room metadata |

### VRide
| Field | Type | Description |
|---|---|---|
| `creator` | ObjectId→User | Ride creator |
| `from` / `to` | String | Route endpoints |
| `date` / `time` | Date/String | Departure info |
| `totalSeats` | Number | 1–4 |
| `seatsAvailable` | Number | Decrements on join |
| `totalFare` / `perPersonFare` | Number | Auto-split fare |
| `mobileNumber` / `whatsappNumber` | String | 10-digit validated |
| `joinedUsers` | Array | `{user, mobileNumber, joinedAt}` |

---

## 🚀 Installation

### Prerequisites
- Node.js v22+
- npm
- A MongoDB Atlas cluster (or local MongoDB instance)
- Cloudinary account
- (Optional) Supabase account

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/your-username/vmedia.git
cd vmedia

# 2. Install dependencies
npm install

# 3. Create your environment file
cp .env.example .env
# Fill in the required values (see below)

# 4. Start the development server
node app.js
# App will be available at http://localhost:4000
```

---

## 🔐 Environment Variables

Create a `.env` file in the root directory with the following keys:

```env
# MongoDB
ATLASDB_URL=mongodb+srv://<username>:<password>@cluster.mongodb.net/vmedia

# Session
SECRET=your_super_secret_session_key

# Cloudinary
CLOUD_NAME=your_cloudinary_cloud_name
CLOUD_API_KEY=your_cloudinary_api_key
CLOUD_API_SECRET=your_cloudinary_api_secret

# Supabase (optional, for additional storage)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_anon_key

# Nodemailer (for email features)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Environment
NODE_ENV=development
```

> **Note**: `dotenv` is only loaded when `NODE_ENV !== "production"`. In production (Vercel), set these as environment variables in the Vercel dashboard.

---

## 📡 API Routes

| Method | Route | Description |
|---|---|---|
| `GET/POST` | `/users/register` | Register a new user |
| `GET/POST` | `/users/login` | Login |
| `GET` | `/users/logout` | Logout |
| `GET/PUT` | `/profile/:id` | View/edit user profile |
| `GET/POST` | `/posts` | Social feed list / create post |
| `DELETE` | `/posts/:id` | Delete a post |
| `GET` | `/marketplace` | Browse all marketplace listings |
| `POST` | `/marketplace/new` | Create a new product listing |
| `GET` | `/marketplace/:id` | View product details |
| `PUT` | `/marketplace/:id` | Edit a listing |
| `DELETE` | `/marketplace/:id` | Delete a listing |
| `POST` | `/marketplace/:id/confirm-deal` | Buyer/seller deal confirmation |
| `POST` | `/marketplace/:id/cancel-deal` | Cancel a pending deal |
| `POST` | `/marketplace/:id/reviews` | Submit a product review |
| `GET` | `/marketplace/chats` | My chat conversations |
| `GET/POST` | `/vride` | List/create rides |
| `POST` | `/vride/:id/join` | Join a ride |
| `GET` | `/nightmess` | Night mess menu |
| `POST` | `/nightmess/new` | Add menu item |
| `PUT` | `/nightmess/:id` | Edit menu item |
| `DELETE` | `/nightmess/:id` | Delete menu item |
| `GET` | `/api/pyq` | Browse PYQ papers |
| `POST` | `/api/pyq` | Upload a PYQ paper |
| `GET` | `/cgpa` | CGPA calculator page |
| `GET` | `/ffcs` | FFCS timetable builder |
| `GET/POST` | `/tasks` | Task planner |
| `GET/POST` | `/confessions` | Anonymous confessions |
| `GET/POST` | `/collab` | Collaboration board |
| `GET/POST` | `/faculty` | Faculty reviews |
| `GET/POST` | `/lost-and-found` | Lost & found |
| `GET` | `/random-chat` | Random chat matching |
| `GET/POST` | `/add-drop` | Add/drop course coordination |
| `GET` | `/notifications` | View notifications |
| `POST` | `/notifications/mark-read` | Mark notifications as read |
| `GET` | `/chat/:roomId` | Open a direct chat room |
| `GET` | `/home` | Landing page (unauthenticated) |
| `GET` | `/aboutus` | About the platform |
| `GET` | `/quiz` | Quiz module |

---

## 📦 Key npm Dependencies

| Package | Version | Purpose |
|---|---|---|
| `express` | ^5.1.0 | Web framework |
| `mongoose` | ^8.14.3 | MongoDB ODM |
| `passport` | ^0.7.0 | Authentication middleware |
| `passport-local` | ^1.0.0 | Local username/password strategy |
| `passport-local-mongoose` | ^8.0.0 | User model integration for Passport |
| `express-session` | ^1.18.1 | Session management |
| `connect-mongo` | ^5.1.0 | MongoDB session store |
| `connect-flash` | ^0.1.1 | Flash messages |
| `socket.io` | ^4.8.1 | Real-time WebSocket communication |
| `cloudinary` | ^1.41.3 | Media CDN |
| `multer` | ^1.4.5-lts.2 | File upload handling |
| `multer-storage-cloudinary` | ^4.0.0 | Multer adapter for Cloudinary |
| `nodemailer` | ^7.0.3 | Email sending |
| `node-cron` | ^4.2.1 | Scheduled background jobs |
| `ejs` | ^3.1.10 | Templating engine |
| `ejs-mate` | ^4.0.0 | EJS layout support |
| `method-override` | ^3.0.0 | PUT/DELETE via HTML forms |
| `express-validator` | ^7.2.1 | Input validation |
| `@supabase/supabase-js` | ^2.49.4 | Supabase integration |
| `dotenv` | ^16.5.0 | Environment variable loading |

---

## 🌐 Deployment

VMedia is configured for **Vercel** deployment via `vercel.json`:

```json
{
  "version": 2,
  "builds": [{ "src": "app.js", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "/app.js" }]
}
```

All incoming requests are routed through `app.js`. Set all environment variables in the Vercel project dashboard before deploying.

### Deploy via Vercel CLI
```bash
npm install -g vercel
vercel login
vercel --prod
```

---

## 🧪 Seeding / Data Utilities

Several utility scripts are included for development:

```bash
# Insert fake marketplace products for testing
node insert_fresh_fake.js

# Delete only seeded/fake products
node delete_fake_products.js

# Clean up ALL seeded data
node cleanup_all_fake.js

# Upload local images to Cloudinary and update DB references
node update_with_local_images.js
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

---

## 📄 License

This project is intended for educational/campus use. All rights reserved by the VMedia team.

---

<div align="center">

Made with ❤️ for campus life · Built with Node.js, MongoDB & Socket.io

</div>
