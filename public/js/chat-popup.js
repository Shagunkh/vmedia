class ChatPopup {
    constructor() {
        this.activeChats = new Map();
        this.socket = null;
        this.currentUser = null;
        this.typingTimeouts = new Map();
        this.joinedRooms = new Set();
        this.pendingMessages = new Set();
        this.dealStatuses = new Map(); // Track deal status per room
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
        
        this.socket.on('deal-confirmation', (data) => {
            console.log('🤝 Deal confirmation received:', data);
            this.handleDealConfirmation(data);
        });
        
        this.socket.on('deal-cancelled', (data) => {
            console.log('❌ Deal cancelled:', data);
            this.handleDealCancelled(data);
        });
        
        this.socket.on('product-available-again', (data) => {
            console.log('✅ Product available again:', data);
            this.handleProductAvailableAgain(data);
        });
        
        this.socket.on('deal-sold', (data) => {
            console.log('🔒 Product sold to another buyer:', data);
            this.showGlobalNotification(`The product "${data.productTitle}" was sold to another buyer.`, 'warning');
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
                const chatCards = doc.querySelectorAll('.chat-card');
                
                chatCards.forEach(card => {
                    const roomId = card.dataset.roomId;
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
                const chatCards = doc.querySelectorAll('.chat-card');
                
                const chatItemsForSidebar = [];
                chatCards.forEach(card => {
                    const roomId = card.dataset.roomId;
                    const productId = card.dataset.productId;
                    const productTitle = card.dataset.productTitle;
                    const productImage = card.dataset.productImage;
                    const otherUserId = card.dataset.otherUserId;
                    const otherUserName = card.dataset.otherUserName;
                    const unreadCount = parseInt(card.dataset.unreadCount) || 0;
                    const type = card.dataset.type || 'product';
                    
                    const lastMessageEl = card.querySelector('.chat-last-message');
                    const lastMessage = lastMessageEl ? lastMessageEl.innerText.trim() : 'No messages yet';
                    
                    if (roomId && productId && otherUserId) {
                        chatItemsForSidebar.push({
                            dataset: {
                                roomId: roomId,
                                productId: productId,
                                productTitle: productTitle,
                                productImage: productImage,
                                otherUserId: otherUserId,
                                otherUserName: otherUserName,
                                unreadCount: unreadCount,
                                lastMessage: lastMessage,
                                type: type
                            }
                        });
                    }
                });
                
                console.log('Found chats:', chatItemsForSidebar.length);
                this.renderChatList(chatItemsForSidebar);
                
                chatItemsForSidebar.forEach(item => {
                    const roomId = item.dataset.roomId;
                    if (roomId && this.socket && !this.joinedRooms.has(roomId)) {
                        this.socket.emit('join-chat-room', roomId);
                        this.joinedRooms.add(roomId);
                        console.log('Auto-joined room:', roomId);
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
            
            const productImage = chat.dataset.productImage || '/images/default-product.jpg';
            
            html += `
                <div class="chat-item" 
                     data-room-id="${chat.dataset.roomId}"
                     data-product-id="${chat.dataset.productId}"
                     data-product-title="${this.escapeHtml(chat.dataset.productTitle)}"
                     data-product-image="${productImage}"
                     data-other-user-id="${chat.dataset.otherUserId}"
                     data-other-user-name="${this.escapeHtml(chat.dataset.otherUserName)}"
                     data-unread-count="${unreadCount}"
                     data-type="${chat.dataset.type}">
                    <img src="${productImage}" class="chat-item-image" onerror="this.src='/images/default-product.jpg'">
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
                    otherUserName: item.dataset.otherUserName,
                    type: item.dataset.type
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
        
        // Fetch deal status
        this.fetchDealStatus(data, chatWindow);
        
        // Determine API endpoint based on type
        let apiEndpoint;
        if (data.type === 'nightmess' || roomId.startsWith('nightmess_')) {
            apiEndpoint = `/nightmess/chat/${data.productId}/${data.otherUserId}`;
        } else {
            apiEndpoint = `/marketplace/chat/${data.productId}/${data.otherUserId}`;
        }
        
        this.loadChatHistory(apiEndpoint, roomId, chatWindow);
    }
    
    fetchDealStatus(data, chatWindow) {
        let url;
        if (data.type === 'nightmess' || data.roomId.startsWith('nightmess_')) {
            url = `/nightmess/item/${data.productId}/deal-status`;
        } else {
            url = `/marketplace/product/${data.productId}/deal-status`;
        }
        
        fetch(url)
            .then(response => response.json())
            .then(status => {
                this.dealStatuses.set(data.roomId, status);
                this.updateDealButton(chatWindow, status);
            })
            .catch(err => console.error('Error fetching deal status:', err));
    }
    
    updateDealButton(chatWindow, status) {
        const dealBtn = chatWindow.querySelector('.confirm-deal-btn');
        const cancelBtn = chatWindow.querySelector('.cancel-deal-btn');
        
        if (status.status === 'sold' || status.status === 'sold_out') {
            if (dealBtn) { dealBtn.disabled = true; dealBtn.innerHTML = '<i class="fas fa-check-circle"></i> Deal Closed'; dealBtn.style.background = '#6b7280'; }
            if (cancelBtn) cancelBtn.style.display = 'none';
            return;
        }
        
        if (status.bothConfirmed) {
            if (dealBtn) { dealBtn.disabled = true; dealBtn.innerHTML = '<i class="fas fa-check-circle"></i> Deal Confirmed!'; dealBtn.style.background = '#10b981'; }
            if (cancelBtn) cancelBtn.style.display = 'none';
            return;
        }
        
        if (status.isQueued) {
            if (dealBtn) { dealBtn.disabled = true; dealBtn.innerHTML = '<i class="fas fa-clock"></i> You are in queue'; dealBtn.style.background = '#6366f1'; }
            if (cancelBtn) cancelBtn.style.display = 'none';
            return;
        }
        
        if (status.userConfirmed) {
            if (dealBtn) { dealBtn.disabled = true; dealBtn.innerHTML = '<i class="fas fa-clock"></i> Waiting for other party...'; dealBtn.style.background = '#f59e0b'; }
            // Show cancel deal button for confirmed party
            if (cancelBtn) { cancelBtn.style.display = 'flex'; cancelBtn.innerHTML = '<i class="fas fa-times-circle"></i> Cancel Deal'; }
            return;
        }
        
        if (dealBtn) { dealBtn.disabled = false; dealBtn.innerHTML = '<i class="fas fa-handshake"></i> Confirm Deal'; dealBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)'; }
        if (cancelBtn) cancelBtn.style.display = 'none';
    }
    
    handleDealConfirmation(data) {
        // Try to find the chat window by productId since we may not have roomId in the event
        let chatWindow = null;
        for (let [roomId, win] of this.activeChats) {
            if (win.dataset.productId === data.productId.toString()) {
                chatWindow = win;
                break;
            }
        }
        
        if (chatWindow) {
            const currentStatus = this.dealStatuses.get(chatWindow.dataset.roomId) || {};
            currentStatus.dealStatus = data.dealStatus;
            currentStatus.bothConfirmed = data.bothConfirmed;
            this.dealStatuses.set(chatWindow.dataset.roomId, currentStatus);
            
            this.updateDealButton(chatWindow, currentStatus);
            
            const messagesContainer = chatWindow.querySelector('.chat-messages');
            const notificationDiv = document.createElement('div');
            notificationDiv.className = 'deal-notification';
            notificationDiv.innerHTML = `
                <div class="deal-notification-content">
                    <i class="fas fa-handshake"></i>
                    <span>${this.escapeHtml(data.confirmedBy)} confirmed the deal! ${data.bothConfirmed ? '🎉 Deal completed!' : 'Waiting for the other party...'}</span>
                </div>
            `;
            messagesContainer.appendChild(notificationDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
            this.playNotificationSound();
        }
    }
    
    handleDealCancelled(data) {
        let chatWindow = null;
        for (let [roomId, win] of this.activeChats) {
            if (win.dataset.productId === data.productId.toString()) {
                chatWindow = win;
                break;
            }
        }
        if (chatWindow) {
            const currentStatus = this.dealStatuses.get(chatWindow.dataset.roomId) || {};
            currentStatus.dealStatus = 'pending';
            currentStatus.userConfirmed = false;
            currentStatus.bothConfirmed = false;
            currentStatus.isQueued = false;
            this.dealStatuses.set(chatWindow.dataset.roomId, currentStatus);
            this.updateDealButton(chatWindow, currentStatus);
            
            const messagesContainer = chatWindow.querySelector('.chat-messages');
            const notificationDiv = document.createElement('div');
            notificationDiv.className = 'deal-notification warning';
            notificationDiv.innerHTML = `<div class="deal-notification-content"><i class="fas fa-times-circle"></i><span>${this.escapeHtml(data.cancelledBy)} cancelled the deal. The product is available again.</span></div>`;
            messagesContainer.appendChild(notificationDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }
    
    handleProductAvailableAgain(data) {
        this.showGlobalNotification(`🎉 ${data.message || `The product "${data.productTitle}" is available again! You may now confirm the deal.`}`, 'success');
    }
    
    showGlobalNotification(message, type = 'info') {
        const colors = { info: '#3b82f6', success: '#10b981', warning: '#f59e0b', error: '#ef4444' };
        const toast = document.createElement('div');
        toast.style.cssText = `position:fixed;bottom:80px;right:20px;background:${colors[type] || colors.info};color:white;padding:14px 20px;border-radius:12px;max-width:320px;z-index:99999;font-size:14px;font-weight:500;box-shadow:0 8px 24px rgba(0,0,0,0.2);animation:slideUp 0.3s ease;`;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 6000);
    }
    
    createChatWindow(data) {
        const chatWindow = document.createElement('div');
        chatWindow.className = 'chat-window';
        chatWindow.dataset.roomId = data.roomId;
        chatWindow.dataset.type = data.type || 'product';
        chatWindow.dataset.productId = data.productId;
        chatWindow.dataset.otherUserId = data.otherUserId;
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
            <div class="chat-deal-area">
                <button class="confirm-deal-btn">
                    <i class="fas fa-handshake"></i> Confirm Deal
                </button>
                <button class="cancel-deal-btn" style="display:none;background:linear-gradient(135deg,#ef4444,#dc2626);color:white;border:none;padding:8px 16px;border-radius:40px;font-weight:600;font-size:13px;cursor:pointer;align-items:center;gap:6px;margin-left:8px;">
                    <i class="fas fa-times-circle"></i> Cancel Deal
                </button>
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
        const confirmDealBtn = chatWindow.querySelector('.confirm-deal-btn');
        const cancelDealBtn = chatWindow.querySelector('.cancel-deal-btn');
        const textarea = chatWindow.querySelector('textarea');
        
        closeBtn.onclick = () => this.closeChat(data.roomId);
        minimizeBtn.onclick = () => chatWindow.classList.toggle('minimized');
        sendBtn.onclick = () => this.sendMessage(chatWindow, data);
        confirmDealBtn.onclick = () => this.confirmDeal(chatWindow, data);
        cancelDealBtn.onclick = () => this.cancelDeal(chatWindow, data);
        
        let typingTimeout;
        textarea.oninput = () => {
            if (this.socket) {
                this.socket.emit('typing-start', { roomId: data.roomId, username: this.currentUser.username });
                clearTimeout(typingTimeout);
                typingTimeout = setTimeout(() => {
                    this.socket.emit('typing-stop', { roomId: data.roomId, username: this.currentUser.username });
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
    
    confirmDeal(chatWindow, data) {
        const confirmBtn = chatWindow.querySelector('.confirm-deal-btn');
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Confirming...';
        
        let url;
        if (data.type === 'nightmess' || data.roomId.startsWith('nightmess_')) {
            url = `/nightmess/item/${data.productId}/deal-confirm`;
        } else {
            url = `/marketplace/product/${data.productId}/deal-confirm`;
        }
        
        // Always send the other userId so server knows which buyer the deal is locked to
        const bodyPayload = { buyerId: data.otherUserId };
        
        fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyPayload)
        })
        .then(response => response.json())
        .then(result => {
            if (result.queued) {
                // Buyer is queued — show info in chat
                const messagesContainer = chatWindow.querySelector('.chat-messages');
                const notificationDiv = document.createElement('div');
                notificationDiv.className = 'deal-notification warning';
                notificationDiv.innerHTML = `
                    <div class="deal-notification-content" style="flex-direction:column;gap:8px;">
                        <div><i class="fas fa-clock"></i> <strong>You've been added to the queue!</strong></div>
                        <div style="font-size:12px;opacity:0.9;">${this.escapeHtml(result.message)}</div>
                        ${result.sellerPhone ? `<div style="font-size:12px;">📞 Call seller: <strong>${this.escapeHtml(result.sellerPhone)}</strong></div>` : ''}
                        ${result.sellerEmail ? `<div style="font-size:12px;">✉️ Email: <strong>${this.escapeHtml(result.sellerEmail)}</strong></div>` : ''}
                    </div>
                `;
                messagesContainer.appendChild(notificationDiv);
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
                
                confirmBtn.disabled = true;
                confirmBtn.innerHTML = '<i class="fas fa-clock"></i> You are in queue';
                confirmBtn.style.background = '#6366f1';
            } else if (result.success) {
                const currentStatus = this.dealStatuses.get(data.roomId) || {};
                currentStatus.userConfirmed = true;
                currentStatus.dealStatus = result.dealStatus;
                currentStatus.bothConfirmed = result.bothConfirmed;
                this.dealStatuses.set(data.roomId, currentStatus);
                
                this.updateDealButton(chatWindow, currentStatus);
                
                const messagesContainer = chatWindow.querySelector('.chat-messages');
                const notificationDiv = document.createElement('div');
                notificationDiv.className = 'deal-notification success';
                notificationDiv.innerHTML = `<div class="deal-notification-content"><i class="fas fa-check-circle"></i><span>${this.escapeHtml(result.message)}</span></div>`;
                messagesContainer.appendChild(notificationDiv);
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
                
                if (result.bothConfirmed) {
                    setTimeout(() => { this.closeChat(data.roomId); this.loadChats(); }, 3000);
                }
            } else {
                alert(result.message || 'Failed to confirm deal');
                confirmBtn.disabled = false;
                confirmBtn.innerHTML = '<i class="fas fa-handshake"></i> Confirm Deal';
            }
        })
        .catch(err => {
            console.error('Error confirming deal:', err);
            alert('Error confirming deal. Please try again.');
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = '<i class="fas fa-handshake"></i> Confirm Deal';
        });
    }
    
    cancelDeal(chatWindow, data) {
        vmConfirm({
            title: 'Cancel This Deal',
            message: 'Are you sure you want to cancel this deal? Queued buyers will be notified.',
            confirmText: 'Yes, Cancel Deal',
            cancelText: 'Keep Deal',
            variant: 'warning',
            onConfirm: () => {
                const cancelBtn = chatWindow.querySelector('.cancel-deal-btn');
                if (cancelBtn) { cancelBtn.disabled = true; cancelBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cancelling...'; }

                const url = (data.type === 'nightmess' || data.roomId.startsWith('nightmess_'))
                    ? `/nightmess/item/${data.productId}/deal-cancel`
                    : `/marketplace/product/${data.productId}/deal-cancel`;

                fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
                .then(r => r.json())
                .then(result => {
                    if (result.success) {
                        const currentStatus = this.dealStatuses.get(data.roomId) || {};
                        currentStatus.dealStatus = 'pending'; currentStatus.userConfirmed = false; currentStatus.bothConfirmed = false;
                        this.dealStatuses.set(data.roomId, currentStatus);
                        this.updateDealButton(chatWindow, currentStatus);

                        const messagesContainer = chatWindow.querySelector('.chat-messages');
                        const notificationDiv = document.createElement('div');
                        notificationDiv.className = 'deal-notification warning';
                        notificationDiv.innerHTML = `<div class="deal-notification-content"><i class="fas fa-times-circle"></i><span>You cancelled the deal. The product is now available again.</span></div>`;
                        messagesContainer.appendChild(notificationDiv);
                        messagesContainer.scrollTop = messagesContainer.scrollHeight;
                    } else {
                        alert(result.message || 'Failed to cancel deal');
                        if (cancelBtn) { cancelBtn.disabled = false; cancelBtn.innerHTML = '<i class="fas fa-times-circle"></i> Cancel Deal'; }
                    }
                })
                .catch(err => {
                    alert('Error cancelling deal.');
                    if (cancelBtn) { cancelBtn.disabled = false; cancelBtn.innerHTML = '<i class="fas fa-times-circle"></i> Cancel Deal'; }
                });
            }
        });
    }
    
    loadChatHistory(apiEndpoint, roomId, chatWindow) {
        console.log('Loading chat history from:', apiEndpoint);
        
        fetch(apiEndpoint)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Chat history received:', data);
                const messagesContainer = chatWindow.querySelector('.chat-messages');
                
                // Update deal status from response
                if (data.dealStatus) {
                    this.dealStatuses.set(roomId, data.dealStatus);
                    this.updateDealButton(chatWindow, data.dealStatus);
                }
                
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
    
    sendMessage(chatWindow, data) {
        const textarea = chatWindow.querySelector('textarea');
        const message = textarea.value.trim();
        
        if (!message) return;
        
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
        
        // Determine API endpoint based on type
        let apiEndpoint;
        if (data.type === 'nightmess' || data.roomId.startsWith('nightmess_')) {
            apiEndpoint = '/nightmess/chat/send';
            messageData.itemId = data.productId;
            delete messageData.productId;
        } else {
            apiEndpoint = '/marketplace/chat/send';
        }
        
        console.log('📤 Sending message to:', apiEndpoint, messageData);
        
        textarea.value = '';
        
        fetch(apiEndpoint, {
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
    
    handleIncomingMessage(data) {
        console.log('📩 Handling incoming message:', data);
        
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
            this.dealStatuses.delete(roomId);
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