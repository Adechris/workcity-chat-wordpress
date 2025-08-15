# WorkCity Chat WordPress Plugin

WordPress integration plugin for the WorkCity Chat application. This plugin provides seamless integration between WordPress and your React/Node.js chat system.

## Features

### Core Features (Option A)
- **Custom Post Type**: Chat Session management
- **Shortcode**: `[workcity_chat]` for embedding chat widget
- **REST API**: Integration endpoints for chat functionality

### Bonus Features
- **WooCommerce Integration**: Order sync and product-based chat
- **Product Chat**: Chat buttons on product pages
- **Order Context**: Automatic chat sessions for order updates

## Installation

1. Copy the plugin folder to `/wp-content/plugins/workcity-chat/`
2. Activate the plugin in WordPress admin
3. Configure your chat API endpoint (default: http://localhost:5000/api)

## Usage

### Basic Chat Widget
```php
[workcity_chat]
```

### Customized Widget
```php
[workcity_chat width="350px" height="400px" position="bottom-right"]
```

### Available Positions
- `bottom-right` (default)
- `bottom-left`
- `inline` (embedded in content)

## REST API Endpoints

### Chat Sessions
- `GET /wp-json/workcity-chat/v1/sessions` - Get all chat sessions
- `POST /wp-json/workcity-chat/v1/sessions` - Create new chat session
- `GET /wp-json/workcity-chat/v1/sessions/{id}` - Get specific session

### WooCommerce Integration
- `GET /wp-json/workcity-chat/v1/orders/{order_id}` - Get order context
- `POST /wp-json/workcity-chat/v1/products/{product_id}/chat` - Start product chat

## Configuration

The plugin automatically connects to your chat backend at:
- API: `http://localhost:5000/api`
- Socket.IO: `http://localhost:5000`

## File Structure

```
workcity-chat/
├── workcity-chat.php          # Main plugin file
├── assets/
│   ├── chat-widget.css        # Widget styling
│   └── chat-widget.js         # Widget functionality
├── includes/
│   └── woocommerce-integration.php  # WooCommerce features
└── README.md                  # This file
```

## Integration with Your Chat App

This plugin works with your existing React/Node.js chat application by:

1. **API Communication**: Sends messages to your backend API
2. **Socket.IO Connection**: Real-time messaging (if available)
3. **Session Management**: Creates WordPress posts for chat sessions
4. **User Context**: Passes WordPress user data to chat system

## WooCommerce Features

### Order Sync
- Automatically creates chat sessions when order status changes
- Includes customer email and order details
- Tracks order context in chat sessions

### Product Chat
- Adds "Chat about this product" button to product pages
- Creates product-specific chat sessions
- Includes product context (name, price, description)

## Customization

### Styling
Edit `assets/chat-widget.css` to customize the widget appearance.

### Functionality
Modify `assets/chat-widget.js` to change widget behavior.

### API Integration
Update the API endpoints in the main plugin file to match your backend.

## Requirements

- WordPress 5.0+
- PHP 7.4+
- Your WorkCity Chat backend running on localhost:5000
- WooCommerce (optional, for bonus features)

## Development

### Testing the Plugin

1. Activate the plugin in WordPress admin
2. Add `[workcity_chat]` shortcode to any page/post
3. Ensure your chat backend is running
4. Test the widget functionality

### API Testing

Test REST endpoints:
```bash
# Get chat sessions
curl http://your-wordpress-site/wp-json/workcity-chat/v1/sessions

# Create chat session
curl -X POST http://your-wordpress-site/wp-json/workcity-chat/v1/sessions \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Session","content":"Test content","participants":"user@example.com"}'
```

## Skills Demonstrated

- WordPress plugin development
- Custom post types and meta fields
- REST API development
- JavaScript/jQuery integration
- WooCommerce hooks and filters
- Responsive CSS design
- AJAX communication
- Security best practices (nonces, sanitization)

## License

MIT License - Same as your main chat application.