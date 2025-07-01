<?php
// api/products_get.php
require 'db_connect.php';

try {
    $query = "
        SELECT 
            p.product_id, 
            p.name, 
            p.description, 
            p.price, 
            p.image_url, 
            p.stock, 
            p.discount_percentage,
            p.is_active,
            p.category_id,
            c.name as category_name
        FROM 
            products AS p
        LEFT JOIN 
            categories AS c ON p.category_id = c.category_id
        ORDER BY 
            p.created_at DESC
    ";
    
    $stmt = $pdo->query($query);
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($products);

} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Error de SQL al obtener productos.', 
        'error_details' => $e->getMessage() 
    ]);
}
?>