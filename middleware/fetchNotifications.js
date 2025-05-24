// middleware/fetchNotifications.js
const Notification = require('../models/notification');
const { getNotificationMessage, formatTimeAgo } = require('./helpers/notifications');

module.exports = async (req, res, next) => {
  res.locals.currUser = req.user;
  res.locals.getNotificationMessage = getNotificationMessage;

  if (req.user) {
    try {
      const notifications = await Notification.find({
        recipient: req.user._id
      })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('sender', 'username profilePhoto')
      .populate('post')
      .lean();

      notifications.forEach(notif => {
        notif.timeAgo = formatTimeAgo(notif.createdAt);
      });

      res.locals.notifications = notifications;
      res.locals.unreadCount = await Notification.countDocuments({
        recipient: req.user._id,
        isRead: false
      });
    } catch (err) {
      console.error('Error fetching notifications:', err);
      res.locals.notifications = [];
      res.locals.unreadCount = 0;
    }
  } else {
    res.locals.notifications = [];
    res.locals.unreadCount = 0;
  }
  next();
};