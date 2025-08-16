jQuery(document).ready(function($) {
    let chatOpen = false;
    let socket = null;
    let currentUser = null;
    
    // Initialize chat widget
    function initChatWidget() {
        const widget = $('#workcity-chat-widget');
        const toggle = widget.find('.chat-toggle');
        const window = widget.find('.chat-window');
        const closeBtn = widget.find('.chat-close');  
        const sendBtn = widget.find('.send-btn');
        const input = widget.find('.chat-input input');
        const messages = widget.find('.chat-messages');
        
        // Set widget dimensions
        const width = widget.data('width') || '400px';
        const height = widget.data('height') || '500px';
        window.css('width', width);
        messages.css('height', parseInt(height) - 140 + 'px');
        
        // Toggle chat window
        toggle.on('click', function() {
            if (!chatOpen) {
                window.slideDown(300);
                chatOpen = true;
                connectToChat();
            } else {
                window.slideUp(300);
                chatOpen = false;
                disconnectFromChat();
            }
        });
        
        // Close chat window
        closeBtn.on('click', function() {
            window.slideUp(300);
            chatOpen = false;
            disconnectFromChat();
        });
        
        // Send message
        function sendMessage() {
            const message = input.val().trim();
            if (message) {
                const messageData = {
                    text: message,
                    sender: currentUser || 'WordPress User',
                    timestamp: new Date().toISOString(),
                    type: 'user'
                };
                
                addMessage(message, 'user');
                saveChatMessage(messageData);
                
                // Auto-reply for demo
                setTimeout(function() {
                    const replyData = {
                        text: 'Message received: ' + message,
                        sender: 'WordPress Bot',
                        timestamp: new Date().toISOString(),
                        type: 'bot'
                    };
                    addMessage(replyData.text, 'bot', 'WordPress Bot');
                    saveChatMessage(replyData);
                }, 1000);
                
                input.val('');
            }
        }
        
        sendBtn.on('click', sendMessage);
        
        input.on('keypress', function(e) {
            if (e.which === 13) {
                sendMessage();
            }
        });
    }
    
    // Connect to chat backend
    function connectToChat() {
        addMessage('WordPress Chat Ready', 'system');
        loadChatHistory();
        
        // Try to connect to Node.js server (optional)
        $.ajax({
            url: 'http://localhost:5000/api/health',
            method: 'GET',
            timeout: 2000,
            success: function() {
                addMessage('Connected to chat server', 'system');
            },
            error: function() {
                addMessage('Chat server offline - using local mode', 'system');
            }
        });
    }
    
    // Disconnect from chat
    function disconnectFromChat() {
        if (socket) {
            socket.disconnect();
            socket = null;
        }
    }
    
    // Add message to chat window
    function addMessage(text, type, sender) {
        const messages = $('.chat-messages');
        const messageClass = type === 'user' ? 'message user' : 
                           type === 'system' ? 'message system' :
                           type === 'error' ? 'message error' : 'message bot';
        
        const timestamp = new Date().toLocaleTimeString();
        const senderName = sender && type === 'bot' ? sender : '';
        const messageHtml = `<div class="${messageClass}">
            ${senderName ? `<div class="message-sender">${escapeHtml(senderName)}</div>` : ''}
            <div class="message-text">${escapeHtml(text)}</div>
            <div class="message-time">${timestamp}</div>
        </div>`;
        messages.append(messageHtml);
        messages.scrollTop(messages[0].scrollHeight);
    }
    
    // Escape HTML to prevent XSS
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Save message to local storage
    function saveChatMessage(messageData) {
        let messages = JSON.parse(localStorage.getItem('wordpress_chat_messages') || '[]');
        messages.push(messageData);
        // Keep only last 50 messages
        if (messages.length > 50) {
            messages = messages.slice(-50);
        }
        localStorage.setItem('wordpress_chat_messages', JSON.stringify(messages));
    }
    
    // Load chat history from local storage
    function loadChatHistory() {
        const messages = JSON.parse(localStorage.getItem('wordpress_chat_messages') || '[]');
        messages.forEach(function(msg) {
            addMessage(msg.text, msg.type, msg.sender);
        });
    }
    
    // Polling fallback for when Socket.IO is not available
    function startPolling() {
        setInterval(function() {
            $.ajax({
                url: workcity_chat.rest_url + 'sessions',
                method: 'GET',
                success: function(sessions) {
                    // Handle new messages from sessions
                    console.log('Polling chat sessions:', sessions);
                },
                error: function(xhr, status, error) {
                    console.error('Polling failed:', error);
                }
            });
        }, 5000);
    }
    
    // Create chat session via WordPress REST API
    function createChatSession(title, participants) {
        $.ajax({
            url: workcity_chat.rest_url + 'sessions',
            method: 'POST',
            headers: {
                'X-WP-Nonce': workcity_chat.nonce,
                'Content-Type': 'application/json'
            },
            data: JSON.stringify({
                title: title,
                content: 'Chat session started from WordPress',
                participants: participants
            }),
            success: function(response) {
                console.log('Chat session created:', response);
            },
            error: function(xhr, status, error) {
                console.error('Failed to create chat session:', error);
            }
        });
    }
    
    // Initialize when DOM is ready
    if ($('#workcity-chat-widget').length) {
        initChatWidget();
        
        // Set current user if logged in
        if (typeof workcity_chat.current_user !== 'undefined') {
            currentUser = workcity_chat.current_user;
        } else {
            currentUser = 'WordPress User';
        }
        
        // Auto-create session for logged-in users
        if (currentUser) {
            createChatSession('WordPress Chat Session', currentUser);
        }
    }
});