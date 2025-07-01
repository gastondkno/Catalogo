<?php
require 'db_connect.php';

try {
    // La consulta es simple, pero verificamos si la tabla existe primero (buena práctica de debug)
    $stmt = $pdo->query("SELECT category_id, name, description FROM categories ORDER BY name ASC");
    $categories = $stmt->fetchAll();
    
    // Devolvemos el array, incluso si está vacío. El frontend se encargará de mostrar el mensaje.
    echo json_encode($categories);

} catch (\PDOException $e) {
    // Esto se ejecutará si la tabla 'categories' no existe o hay otro error de SQL
    http_response_code(500);
    // Devolvemos un mensaje de error claro en formato JSON
    echo json_encode([
        'success' => false, 
        'message' => 'Error al consultar la base de datos.', 
        'error' => $e->getMessage() // Esto mostrará el error exacto, ej: "Table 'u123_db.categories' doesn't exist"
    ]);
}
?>