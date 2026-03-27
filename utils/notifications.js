// utils/notifications.js
const Notification = require('../models/notification');
const Post = require('../models/post');

exports.createNotification = async (data) => {
  try {
    let message = '';
    let postImageUrl = '';
    
    // Set appropriate message based on notification type
    switch(data.type) {
      case 'follow-request':
        message = `${data.sender} sent you a follow request`;
        break;
      case 'follow-accepted':
        message = `${data.sender} accepted your follow request`;
        break;
      case 'post-like':
        message = `${data.sender} liked your post`;
        if (data.post) {
          const post = await Post.findById(data.post).select('imageUrl');
          postImageUrl = post?.imageUrl || '';
        }
        break;
      case 'comment':
        message = `${data.sender} commented on your post`;
        if (data.post) {
          const post = await Post.findById(data.post).select('imageUrl');
          postImageUrl = post?.imageUrl || '';
        }
        break;
      case 'comment-like':
        message = `${data.sender} liked your comment`;
        if (data.post) {
          const post = await Post.findById(data.post).select('imageUrl');
          postImageUrl = post?.imageUrl || '';
        }
        break;
      case 'reply':
        message = `${data.sender} replied to your comment`;
        if (data.post) {
          const post = await Post.findById(data.post).select('imageUrl');
          postImageUrl = post?.imageUrl || '';
        }
        break;
      case 'reply-like':
        message = `${data.sender} liked your reply`;
        if (data.post) {
          const post = await Post.findById(data.post).select('imageUrl');
          postImageUrl = post?.imageUrl || '';
        }
        break;
    }
    
    const notification = new Notification({
      recipient: data.recipient,
      sender: data.sender,
      type: data.type,
      post: data.post,
      comment: data.comment,
      postImageUrl,
      message,
      isRead: false
    });
    
    await notification.save();
    
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};