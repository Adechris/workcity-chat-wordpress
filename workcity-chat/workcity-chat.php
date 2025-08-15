<?php
 

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('WORKCITY_CHAT_PLUGIN_URL', plugin_dir_url(__FILE__));
define('WORKCITY_CHAT_PLUGIN_PATH', plugin_dir_path(__FILE__));

class WorkCityChat {
    
    public function __construct() {
        add_action('init', array($this, 'init'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
        add_action('rest_api_init', array($this, 'register_rest_routes'));
        add_shortcode('workcity_chat', array($this, 'chat_shortcode'));
        register_activation_hook(__FILE__, array($this, 'activate'));
    }
    
    public function init() {
        $this->register_post_types();
    }
    
    public function register_post_types() {
        // Register Chat Session post type
        register_post_type('chat_session', array(
            'labels' => array(
                'name' => 'Chat Sessions',
                'singular_name' => 'Chat Session',
                'add_new' => 'Add New Session',
                'add_new_item' => 'Add New Chat Session',
                'edit_item' => 'Edit Chat Session',
                'new_item' => 'New Chat Session',
                'view_item' => 'View Chat Session',
                'search_items' => 'Search Chat Sessions',
                'not_found' => 'No chat sessions found',
                'not_found_in_trash' => 'No chat sessions found in trash'
            ),
            'public' => true,
            'has_archive' => true,
            'supports' => array('title', 'editor', 'custom-fields'),
            'menu_icon' => 'dashicons-format-chat',
            'show_in_rest' => true,
            'rest_base' => 'chat-sessions'
        ));
    }
    
    public function enqueue_scripts() {
        wp_enqueue_script('workcity-chat-widget', WORKCITY_CHAT_PLUGIN_URL . 'assets/chat-widget.js', array('jquery'), '1.0.0', true);
        wp_enqueue_style('workcity-chat-widget', WORKCITY_CHAT_PLUGIN_URL . 'assets/chat-widget.css', array(), '1.0.0');
        
        // Localize script with API endpoint
        wp_localize_script('workcity-chat-widget', 'workcity_chat', array(
            'api_url' => 'http://localhost:5000/api',
            'nonce' => wp_create_nonce('wp_rest'),
            'rest_url' => rest_url('workcity-chat/v1/')
        ));
        
        // Add inline test script
        wp_add_inline_script('workcity-chat-widget', 'console.log("WorkCity Chat plugin loaded");');
    }
    
    public function register_rest_routes() {
        register_rest_route('workcity-chat/v1', '/sessions', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_chat_sessions'),
            'permission_callback' => '__return_true'
        ));
        
        register_rest_route('workcity-chat/v1', '/sessions', array(
            'methods' => 'POST',
            'callback' => array($this, 'create_chat_session'),
            'permission_callback' => array($this, 'check_permissions')
        ));
        
        register_rest_route('workcity-chat/v1', '/sessions/(?P<id>\d+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_chat_session'),
            'permission_callback' => '__return_true'
        ));
    }
    
    public function get_chat_sessions($request) {
        $sessions = get_posts(array(
            'post_type' => 'chat_session',
            'numberposts' => -1,
            'post_status' => 'publish'
        ));
        
        $data = array();
        foreach ($sessions as $session) {
            $data[] = array(
                'id' => $session->ID,
                'title' => $session->post_title,
                'content' => $session->post_content,
                'date' => $session->post_date,
                'participants' => get_post_meta($session->ID, 'participants', true),
                'status' => get_post_meta($session->ID, 'status', true)
            );
        }
        
        return rest_ensure_response($data);
    }
    
    public function create_chat_session($request) {
        $params = $request->get_params();
        
        $post_id = wp_insert_post(array(
            'post_title' => sanitize_text_field($params['title']),
            'post_content' => sanitize_textarea_field($params['content']),
            'post_type' => 'chat_session',
            'post_status' => 'publish'
        ));
        
        if ($post_id) {
            update_post_meta($post_id, 'participants', sanitize_text_field($params['participants']));
            update_post_meta($post_id, 'status', 'active');
            
            return rest_ensure_response(array(
                'id' => $post_id,
                'message' => 'Chat session created successfully'
            ));
        }
        
        return new WP_Error('creation_failed', 'Failed to create chat session', array('status' => 500));
    }
    
    public function get_chat_session($request) {
        $id = $request['id'];
        $session = get_post($id);
        
        if (!$session || $session->post_type !== 'chat_session') {
            return new WP_Error('not_found', 'Chat session not found', array('status' => 404));
        }
        
        return rest_ensure_response(array(
            'id' => $session->ID,
            'title' => $session->post_title,
            'content' => $session->post_content,
            'date' => $session->post_date,
            'participants' => get_post_meta($session->ID, 'participants', true),
            'status' => get_post_meta($session->ID, 'status', true)
        ));
    }
    
    public function check_permissions() {
        return current_user_can('edit_posts');
    }
    
    public function chat_shortcode($atts) {
        $atts = shortcode_atts(array(
            'width' => '400px',
            'height' => '500px',
            'position' => 'bottom-right'
        ), $atts);
        
        ob_start();
        ?>
        <div id="workcity-chat-widget" 
             data-width="<?php echo esc_attr($atts['width']); ?>"
             data-height="<?php echo esc_attr($atts['height']); ?>"
             data-position="<?php echo esc_attr($atts['position']); ?>">
            <div class="chat-toggle">
                <span class="dashicons dashicons-format-chat"></span>
                Chat
            </div>
            <div class="chat-window" style="display: none;">
                <div class="chat-header">
                    <h4>WorkCity Chat</h4>
                    <button class="chat-close">&times;</button>
                </div>
                <div class="chat-messages"></div>
                <div class="chat-input">
                    <input type="text" placeholder="Type your message..." />
                    <button class="send-btn">Send</button>
                </div>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }
    
    public function activate() {
        $this->register_post_types();
        flush_rewrite_rules();
    }
}

// Include additional files
require_once WORKCITY_CHAT_PLUGIN_PATH . 'includes/woocommerce-integration.php';

// Initialize the plugin
new WorkCityChat();