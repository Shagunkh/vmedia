// helpers/notifications.js
function getNotificationMessage(notificationType) {
  // Your notification message logic here
  // Example:
  const messages = {
    'like': 'liked your post',
    'comment': 'commented on your post',
    'follow': 'started following you'
  };
  return messages[notificationType] || 'sent you a notification';
}

function formatTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) return `${interval}y ago`;
  
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) return `${interval}mo ago`;
  
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) return `${interval}d ago`;
  
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) return `${interval}h ago`;
  
  interval = Math.floor(seconds / 60);
  if (interval >= 1) return `${interval}m ago`;
  
  return 'Just now';
}

module.exports = { getNotificationMessage, formatTimeAgo };