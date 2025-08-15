<?php
/**
 * WooCommerce Integration for WorkCity Chat
 * Bonus feature: Order sync and product-based chat context
 */

if (!defined('ABSPATH')) {
    exit;
}

class WorkCityChatWooCommerce {
    
    public function __construct() {
        // Only initialize if WooCommerce is active
        if (class_exists('WooCommerce')) {
            add_action('init', array($this, 'init'));
            add_action('woocommerce_order_status_changed', array($this, 'sync_order_to_chat'), 10, 3);
            add_action('woocommerce_single_product_summary', array($this, 'add_product_chat_button'), 25);
        }
    }
    
    public function init() {
        add_action('rest_api_init', array($this, 'register_woo_routes'));
    }
    
    public function register_woo_routes() {
        register_rest_route('workcity-chat/v1', '/orders/(?P<order_id>\d+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_order_chat_context'),
            'permission_callback' => array($this, 'check_order_permissions')
        ));
        
        register_rest_route('workcity-chat/v1', '/products/(?P<product_id>\d+)/chat', array(
            'methods' => 'POST',
            'callback' => array($this, 'start_product_chat'),
            'permission_callback' => '__return_true'
        ));
    }
    
    public function sync_order_to_chat($order_id, $old_status, $new_status) {
        $order = wc_get_order($order_id);
        if (!$order) return;
        
        $session_title = sprintf('Order #%d - Status Update', $order_id);
        $session_content = sprintf(
            'Order status changed from %s to %s. Customer: %s',
            $old_status,
            $new_status,
            $order->get_billing_email()
        );
        
        $post_id = wp_insert_post(array(
            'post_title' => $session_title,
            'post_content' => $session_content,
            'post_type' => 'chat_session',
            'post_status' => 'publish'
        ));
        
        if ($post_id) {
            update_post_meta($post_id, 'order_id', $order_id);
            update_post_meta($post_id, 'customer_email', $order->get_billing_email());
            update_post_meta($post_id, 'order_status', $new_status);
            update_post_meta($post_id, 'participants', $order->get_billing_email());
            update_post_meta($post_id, 'status', 'active');
            update_post_meta($post_id, 'context_type', 'woocommerce_order');
        }
    }
    
    public function add_product_chat_button() {
        global $product;
        if (!$product) return;
        
        echo '<div class="product-chat-button" style="margin: 20px 0;">';
        echo '<button class="button alt" onclick="startProductChat(' . $product->get_id() . ')">';
        echo 'Chat about this product';
        echo '</button>';
        echo '</div>';
        
        ?>
        <script>
        function startProductChat(productId) {
            jQuery.post('<?php echo rest_url('workcity-chat/v1/products/'); ?>' + productId + '/chat', {
                _wpnonce: '<?php echo wp_create_nonce('wp_rest'); ?>'
            }).done(function(response) {
                alert('Product chat session started!');
            });
        }
        </script>
        <?php
    }
    
    public function get_order_chat_context($request) {
        $order_id = $request['order_id'];
        $order = wc_get_order($order_id);
        
        if (!$order) {
            return new WP_Error('order_not_found', 'Order not found', array('status' => 404));
        }
        
        return rest_ensure_response(array(
            'order_id' => $order_id,
            'status' => $order->get_status(),
            'total' => $order->get_total(),
            'customer_email' => $order->get_billing_email()
        ));
    }
    
    public function start_product_chat($request) {
        $product_id = $request['product_id'];
        $product = wc_get_product($product_id);
        
        if (!$product) {
            return new WP_Error('product_not_found', 'Product not found', array('status' => 404));
        }
        
        $post_id = wp_insert_post(array(
            'post_title' => 'Product Chat: ' . $product->get_name(),
            'post_content' => 'Chat session for product: ' . $product->get_name(),
            'post_type' => 'chat_session',
            'post_status' => 'publish'
        ));
        
        if ($post_id) {
            update_post_meta($post_id, 'product_id', $product_id);
            update_post_meta($post_id, 'context_type', 'woocommerce_product');
            update_post_meta($post_id, 'status', 'active');
            
            return rest_ensure_response(array('session_id' => $post_id));
        }
        
        return new WP_Error('session_creation_failed', 'Failed to create chat session', array('status' => 500));
    }
    
    public function check_order_permissions($request) {
        return current_user_can('manage_woocommerce') || current_user_can('edit_posts');
    }
}

new WorkCityChatWooCommerce();