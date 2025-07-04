<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

include_once 'db_connect.php';

try {
    // ---- INICIO DE LA CORRECCIÓN ----
    // Usamos los nombres de columna EXACTOS de tu tabla `productos`:
    // p.id, p.nombre, p.descripcion, p.precio, p.stock, etc.
    // Y los renombramos con 'AS' para que el JSON de salida siga usando
    // 'name', 'price', etc., como espera el archivo admin.js.
    $query_products = "SELECT 
                           p.id, 
                           p.nombre AS name,
                           p.descripcion AS description,
                           p.precio AS price,
                           p.category_id, 
                           p.stock, 
                           p.discount_percentage, 
                           p.is_active, 
                           c.name AS category_name 
                       FROM productos AS p
                       LEFT JOIN categories AS c ON p.category_id = c.category_id 
                       ORDER BY p.id DESC";
    // ---- FIN DE LA CORRECCIÓN ----
                       
    $stmt_products = $conexion->prepare($query_products);
    $stmt_products->execute();
    $products = $stmt_products->fetchAll(PDO::FETCH_ASSOC);

    $query_images = "SELECT id as id_imagen, nombre_archivo FROM producto_imagenes WHERE id_producto = :id_producto ORDER BY orden ASC";
    $stmt_images = $conexion->prepare($query_images);

    foreach ($products as $key => $product) {
        $stmt_images->bindParam(':id_producto', $product['id']);
        $stmt_images->execute();
        $images = $stmt_images->fetchAll(PDO::FETCH_ASSOC);
        
        // El frontend (admin.js) espera una propiedad 'product_id'.
        // La creamos a partir de la columna 'id' que obtuvimos.
        $products[$key]['product_id'] = $product['id'];
        
        $products[$key]['images'] = $images;
    }

    echo json_encode($products);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error al obtener productos: " . $e->getMessage()]);
}
?>