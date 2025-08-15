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
                addMessage(message, 'user');
                
                // Try to send to chat API
                $.ajax({
                    url: workcity_chat.api_url + '/messages',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    data: JSON.stringify({
                        message: message,
                        sender: currentUser || 'wordpress_user',
                        timestamp: new Date().toISOString()
                    }),
                    success: function(response) {
                        addMessage('Message sent to chat system!', 'system');
                    },
                    error: function(xhr, status, error) {
                        // Fallback: Show local response
                        setTimeout(function() {
                            addMessage('Message received: ' + message, 'bot');
                        }, 1000);
                        
                        // Create WordPress chat session
                        createChatSession('WordPress Chat: ' + new Date().toLocaleString(), message);
                    }
                });
                
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
        try {
            // Try to connect to Socket.IO server
            if (typeof io !== 'undefined') {
                socket = io(workcity_chat.api_url.replace('/api', ''));
                
                socket.on('connect', function() {
                    console.log('Connected to chat server');
                    addMessage('Connected to chat', 'system');
                });
                
                socket.on('new-message', function(data) {
                    if (data.sender !== currentUser) {
                        addMessage(data.message, 'bot');
                    }
                });
                
                socket.on('disconnect', function() {
                    console.log('Disconnected from chat server');
                });
            } else {
                // Fallback to polling if Socket.IO not available
                addMessage('Chat connected (polling mode)', 'system');
                startPolling();
            }
        } catch (error) {
            console.error('Failed to connect to chat:', error);
            addMessage('Connection failed. Using offline mode.', 'error');
        }
    }
    
    // Disconnect from chat
    function disconnectFromChat() {
        if (socket) {
            socket.disconnect();
            socket = null;
        }
    }
    
    // Add message to chat window
    function addMessage(text, type) {
        const messages = $('.chat-messages');
        const messageClass = type === 'user' ? 'message user' : 
                           type === 'system' ? 'message system' :
                           type === 'error' ? 'message error' : 'message bot';
        
        const timestamp = new Date().toLocaleTimeString();
        const messageHtml = `<div class="${messageClass}">
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
        }
        
        // Auto-create session for logged-in users
        if (currentUser) {
            createChatSession('WordPress Chat Session', currentUser);
        }
    }
});