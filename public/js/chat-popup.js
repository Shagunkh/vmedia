class ChatPopup {
    constructor() {
        this.activeChats = new Map();
        this.socket = null;
        this.currentUser = null;
        this.typingTimeouts = new Map();
        this.joinedRooms = new Set();
        this.pendingMessages = new Set(); // Track pending messages to prevent duplicates
        this.init();
    }
    
    init() {
        this.currentUser = window.currentUser;
        
        if (!this.currentUser || !this.currentUser._id) {
            console.log('No user logged in');
            return;
        }
        
        console.log('Initializing chat for user:', this.currentUser.username);
        
        if (window.io) {
            this.initSocket();
        } else {
            console.error('Socket.io not loaded');
        }
        
        this.createChatContainer();
        
        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }
    
    initSocket() {
        this.socket = io();
        
        this.socket.on('connect', () => {
            console.log('✅ Socket connected, ID:', this.socket.id);
            this.socket.emit('register-user', this.currentUser._id);
            this.autoJoinAllChatRooms();
        });
        
        this.socket.on('registered', (data) => {
            console.log('✅ Registered with server:', data);
        });
        
        this.socket.on('room-joined', (data) => {
            console.log('✅ Joined room:', data.roomId);
            this.joinedRooms.add(data.roomId);
        });
        
        this.socket.on('receive-chat-message', (data) => {
            console.log('📩 Received real-time message:', data);
            this.handleIncomingMessage(data);
        });
        
        this.socket.on('user-typing', (data) => {
            this.handleTypingIndicator(data);
        });
        
        this.socket.on('chat-notification', (data) => {
            console.log('🔔 Notification:', data);
            this.showNotification(data);
        });
        
        this.socket.on('disconnect', () => {
            console.log('❌ Socket disconnected');
        });
    }
    
    autoJoinAllChatRooms() {
        fetch('/marketplace/my-chats')
            .then(response => response.text())
            .then(html => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const chatItems = doc.querySelectorAll('.chat-item');
                
                chatItems.forEach(item => {
                    const roomId = item.dataset.roomId;
                    if (roomId && !this.joinedRooms.has(roomId)) {
                        this.socket.emit('join-chat-room', roomId);
                        this.joinedRooms.add(roomId);
                        console.log('Auto-joined room:', roomId);
                    }
                });
            })
            .catch(err => console.error('Error auto-joining rooms:', err));
    }
    
    createChatContainer() {
        const chatButton = document.createElement('div');
        chatButton.className = 'chat-floating-button';
        chatButton.innerHTML = '<i class="fas fa-comments"></i><span class="chat-badge">0</span>';
        chatButton.onclick = () => this.toggleChatList();
        document.body.appendChild(chatButton);
        
        const chatSidebar = document.createElement('div');
        chatSidebar.className = 'chat-sidebar';
        chatSidebar.innerHTML = `
            <div class="chat-sidebar-header">
                <h5>Messages</h5>
                <button class="close-chat-sidebar">&times;</button>
            </div>
            <div class="chat-sidebar-content">
                <div class="loading-chats">Loading chats...</div>
            </div>
        `;
        document.body.appendChild(chatSidebar);
        
        chatSidebar.querySelector('.close-chat-sidebar').onclick = () => {
            chatSidebar.classList.remove('open');
        };
        
        this.chatSidebar = chatSidebar;
        this.chatButton = chatButton;
        this.loadChats();
    }
    
    loadChats() {
        fetch('/marketplace/my-chats')
            .then(response => response.text())
            .then(html => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const chatItems = doc.querySelectorAll('.chat-item');
                this.renderChatList(chatItems);
                
                chatItems.forEach(item => {
                    const roomId = item.dataset.roomId;
                    if (roomId && this.socket && !this.joinedRooms.has(roomId)) {
                        this.socket.emit('join-chat-room', roomId);
                        this.joinedRooms.add(roomId);
                    }
                });
            })
            .catch(err => console.error('Error loading chats:', err));
    }
    
    renderChatList(chatItems) {
        const content = this.chatSidebar.querySelector('.chat-sidebar-content');
        if (!chatItems || chatItems.length === 0) {
            content.innerHTML = '<div class="no-chats">No active chats yet</div>';
            return;
        }
        
        let html = '';
        let totalUnread = 0;
        
        chatItems.forEach(chat => {
            const unreadCount = parseInt(chat.dataset.unreadCount) || 0;
            totalUnread += unreadCount;
            const unreadBadge = unreadCount > 0 ? `<span class="unread-badge">${unreadCount}</span>` : '';
            
            html += `
                <div class="chat-item" 
                     data-room-id="${chat.dataset.roomId}"
                     data-product-id="${chat.dataset.productId}"
                     data-product-title="${chat.dataset.productTitle}"
                     data-product-image="${chat.dataset.productImage}"
                     data-other-user-id="${chat.dataset.otherUserId}"
                     data-other-user-name="${chat.dataset.otherUserName}"
                     data-unread-count="${unreadCount}">
                    <img src="${chat.dataset.productImage || '/images/default-product.jpg'}" class="chat-item-image">
                    <div class="chat-item-info">
                        <div class="chat-item-title">${this.escapeHtml(chat.dataset.productTitle)}</div>
                        <div class="chat-item-user">with ${this.escapeHtml(chat.dataset.otherUserName)}</div>
                        <div class="chat-item-last-message">${this.escapeHtml(chat.dataset.lastMessage || 'No messages yet')}</div>
                    </div>
                    ${unreadBadge}
                </div>
            `;
        });
        
        content.innerHTML = html;
        
        const badge = document.querySelector('.chat-badge');
        if (badge) {
            if (totalUnread > 0) {
                badge.textContent = totalUnread > 99 ? '99+' : totalUnread;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }
        
        document.querySelectorAll('.chat-item').forEach(item => {
            item.onclick = () => {
                const data = {
                    roomId: item.dataset.roomId,
                    productId: item.dataset.productId,
                    productTitle: item.dataset.productTitle,
                    productImage: item.dataset.productImage,
                    otherUserId: item.dataset.otherUserId,
                    otherUserName: item.dataset.otherUserName
                };
                this.openChat(data);
                
                const unreadBadge = item.querySelector('.unread-badge');
                if (unreadBadge) unreadBadge.remove();
                item.dataset.unreadCount = '0';
                this.updateTotalUnread();
            };
        });
    }
    
    openChat(data) {
        const roomId = data.roomId;
        
        if (this.socket && !this.joinedRooms.has(roomId)) {
            this.socket.emit('join-chat-room', roomId);
            this.joinedRooms.add(roomId);
        }
        
        if (this.activeChats.has(roomId)) {
            const existingChat = this.activeChats.get(roomId);
            existingChat.classList.remove('minimized');
            existingChat.focus();
            return;
        }
        
        const chatWindow = this.createChatWindow(data);
        this.activeChats.set(roomId, chatWindow);
        this.loadChatHistory(roomId, data.productId, data.otherUserId, chatWindow);
    }
    
    createChatWindow(data) {
        const chatWindow = document.createElement('div');
        chatWindow.className = 'chat-window';
        chatWindow.dataset.roomId = data.roomId;
        chatWindow.innerHTML = `
            <div class="chat-window-header">
                <div class="chat-window-title">
                    <strong>${this.escapeHtml(data.productTitle)}</strong>
                    <small>with ${this.escapeHtml(data.otherUserName)}</small>
                </div>
                <button class="minimize-chat">−</button>
                <button class="close-chat">×</button>
            </div>
            <div class="chat-messages-container">
                <div class="chat-messages">
                    <div class="loading-messages">Loading messages...</div>
                </div>
                <div class="typing-indicator" style="display: none;">
                    <span class="typing-text">Typing...</span>
                </div>
            </div>
            <div class="chat-input-area">
                <textarea placeholder="Type your message..." rows="2"></textarea>
                <button class="send-message">Send</button>
            </div>
        `;
        
        document.body.appendChild(chatWindow);
        
        const windows = document.querySelectorAll('.chat-window:not(.minimized)');
        const offset = windows.length * 20;
        chatWindow.style.bottom = `${20 + offset}px`;
        chatWindow.style.right = `${20 + offset}px`;
        
        const closeBtn = chatWindow.querySelector('.close-chat');
        const minimizeBtn = chatWindow.querySelector('.minimize-chat');
        const sendBtn = chatWindow.querySelector('.send-message');
        const textarea = chatWindow.querySelector('textarea');
        
        closeBtn.onclick = () => this.closeChat(data.roomId);
        minimizeBtn.onclick = () => chatWindow.classList.toggle('minimized');
        sendBtn.onclick = () => this.sendMessage(chatWindow, data);
        
        let typingTimeout;
        textarea.oninput = () => {
            if (this.socket) {
                this.socket.emit('typing-start', {
                    roomId: data.roomId,
                    username: this.currentUser.username
                });
                
                clearTimeout(typingTimeout);
                typingTimeout = setTimeout(() => {
                    this.socket.emit('typing-stop', {
                        roomId: data.roomId,
                        username: this.currentUser.username
                    });
                }, 1000);
            }
        };
        
        textarea.onkeypress = (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage(chatWindow, data);
            }
        };
        
        return chatWindow;
    }
    
    loadChatHistory(roomId, productId, otherUserId, chatWindow) {
        console.log('Loading chat history for:', { roomId, productId, otherUserId });
        
        fetch(`/marketplace/chat/${productId}/${otherUserId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Chat history received:', data);
                const messagesContainer = chatWindow.querySelector('.chat-messages');
                
                if (data.messages && data.messages.length > 0) {
                    this.displayMessages(chatWindow, data.messages);
                } else {
                    messagesContainer.innerHTML = '<div class="no-messages">No messages yet. Start the conversation!</div>';
                }
            })
            .catch(err => {
                console.error('Error loading messages:', err);
                const messagesContainer = chatWindow.querySelector('.chat-messages');
                messagesContainer.innerHTML = '<div class="error-messages">Error loading messages. Please refresh the page.</div>';
            });
    }
    
    displayMessages(chatWindow, messages) {
        const messagesContainer = chatWindow.querySelector('.chat-messages');
        messagesContainer.innerHTML = '';
        
        messages.forEach(msg => {
            const isOwn = msg.sender._id === this.currentUser._id;
            const messageDiv = this.createMessageElement(msg, isOwn);
            messageDiv.dataset.messageId = msg._id;
            messagesContainer.appendChild(messageDiv);
        });
        
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    createMessageElement(msg, isOwn) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isOwn ? 'own-message' : 'other-message'}`;
        
        const time = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageDiv.innerHTML = `
            <div class="message-sender">${this.escapeHtml(msg.sender.username)}</div>
            <div class="message-text">${this.escapeHtml(msg.message)}</div>
            <div class="message-time">${time}</div>
        `;
        
        return messageDiv;
    }
    
    // FIXED: No local message addition - let socket handle it
    sendMessage(chatWindow, data) {
        const textarea = chatWindow.querySelector('textarea');
        const message = textarea.value.trim();
        
        if (!message) return;
        
        // Create a temporary ID to track this message
        const tempId = Date.now() + '_' + Math.random();
        this.pendingMessages.add(tempId);
        
        const messageData = {
            productId: data.productId,
            receiverId: data.otherUserId,
            message: message,
            roomId: data.roomId,
            productTitle: data.productTitle,
            sender: {
                _id: this.currentUser._id,
                username: this.currentUser.username,
                profilePhoto: this.currentUser.profilePhoto
            },
            tempId: tempId
        };
        
        console.log('📤 Sending message:', messageData);
        
        // Clear input immediately
        textarea.value = '';
        
        // Save to database - backend will broadcast to room
        fetch('/marketplace/chat/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(messageData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('✅ Message saved successfully');
                // Remove from pending
                this.pendingMessages.delete(tempId);
            } else {
                console.error('Failed to send message:', data);
                alert('Failed to send message. Please try again.');
                textarea.value = message;
            }
        })
        .catch(err => {
            console.error('Error sending message:', err);
            alert('Error sending message. Please check your connection.');
            textarea.value = message;
            this.pendingMessages.delete(tempId);
        });
    }
    
    // FIXED: Strict duplicate prevention
    handleIncomingMessage(data) {
        console.log('📩 Handling incoming message:', data);
        
        // Check if this is a message we just sent (by tempId)
        if (data.tempId && this.pendingMessages.has(data.tempId)) {
            console.log('Ignoring our own message (still pending)');
            return;
        }
        
        let chatWindow = null;
        for (let [roomId, window] of this.activeChats) {
            if (roomId === data.roomId) {
                chatWindow = window;
                break;
            }
        }
        
        if (chatWindow && !chatWindow.classList.contains('minimized')) {
            const messagesContainer = chatWindow.querySelector('.chat-messages');
            
            if (messagesContainer.querySelector('.no-messages')) {
                messagesContainer.innerHTML = '';
            }
            
            // STRICT duplicate check by message ID
            const existingMessages = messagesContainer.querySelectorAll('.message');
            let messageExists = false;
            
            for (let msg of existingMessages) {
                if (msg.dataset.messageId === data._id) {
                    messageExists = true;
                    break;
                }
            }
            
            if (!messageExists) {
                const messageDiv = this.createMessageElement({
                    _id: data._id,
                    message: data.message,
                    sender: data.sender,
                    createdAt: data.createdAt || new Date()
                }, data.sender._id === this.currentUser._id);
                
                messageDiv.dataset.messageId = data._id;
                messagesContainer.appendChild(messageDiv);
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
                this.playNotificationSound();
            } else {
                console.log('Duplicate message detected, ignoring:', data._id);
            }
        } else {
            this.updateChatUnreadCount(data.roomId);
            this.showNotification({
                sender: data.sender.username,
                message: data.message,
                productTitle: data.productTitle
            });
        }
    }
    
    handleTypingIndicator(data) {
        let chatWindow = null;
        for (let [roomId, window] of this.activeChats) {
            if (roomId === data.roomId) {
                chatWindow = window;
                break;
            }
        }
        
        if (chatWindow && !chatWindow.classList.contains('minimized')) {
            const typingIndicator = chatWindow.querySelector('.typing-indicator');
            if (typingIndicator) {
                if (data.isTyping) {
                    typingIndicator.style.display = 'block';
                    typingIndicator.querySelector('.typing-text').textContent = `${data.username} is typing...`;
                } else {
                    typingIndicator.style.display = 'none';
                }
            }
        }
    }
    
    updateChatUnreadCount(roomId) {
        const chatItems = document.querySelectorAll('.chat-item');
        for (let item of chatItems) {
            if (item.dataset.roomId === roomId) {
                const currentUnread = parseInt(item.dataset.unreadCount) || 0;
                const newUnread = currentUnread + 1;
                item.dataset.unreadCount = newUnread;
                
                let unreadBadge = item.querySelector('.unread-badge');
                if (!unreadBadge) {
                    unreadBadge = document.createElement('span');
                    unreadBadge.className = 'unread-badge';
                    item.appendChild(unreadBadge);
                }
                unreadBadge.textContent = newUnread;
                unreadBadge.style.display = 'flex';
                
                this.updateTotalUnread();
                break;
            }
        }
    }
    
    updateTotalUnread() {
        const chatItems = document.querySelectorAll('.chat-item');
        let totalUnread = 0;
        chatItems.forEach(item => {
            totalUnread += parseInt(item.dataset.unreadCount) || 0;
        });
        
        const badge = document.querySelector('.chat-badge');
        if (badge) {
            if (totalUnread > 0) {
                badge.textContent = totalUnread > 99 ? '99+' : totalUnread;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }
    }
    
    showNotification(data) {
        this.updateTotalUnread();
        
        if (Notification.permission === 'granted' && document.hidden) {
            new Notification('New Message', {
                body: `${data.sender}: ${data.message}`,
                icon: '/images/logo.png'
            });
        }
    }
    
    playNotificationSound() {
        try {
            const audio = new Audio('/sounds/notification.mp3');
            audio.volume = 0.2;
            audio.play().catch(e => console.log('Audio play failed'));
        } catch (e) {}
    }
    
    toggleChatList() {
        this.chatSidebar.classList.toggle('open');
        if (this.chatSidebar.classList.contains('open')) {
            this.loadChats();
        }
    }
    
    closeChat(roomId) {
        const chatWindow = this.activeChats.get(roomId);
        if (chatWindow) {
            if (this.socket) {
                this.socket.emit('leave-chat-room', roomId);
                this.joinedRooms.delete(roomId);
            }
            chatWindow.remove();
            this.activeChats.delete(roomId);
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (window.currentUser && window.currentUser._id) {
        window.chatPopup = new ChatPopup();
    }
});