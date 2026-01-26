<?php
/**
 * Script para verificar las imágenes en la base de datos
 * Ejecuta: php backend/scripts/check_images.php
 */

// Configuración de la base de datos
$host = 'localhost';
$user = 'root';
$pass = '';
$db = 'peruana_informatica';

// Conectar a la base de datos
$conn = mysqli_connect($host, $user, $pass, $db);

if (!$conn) {
    die("Conexion fallida: " . mysqli_connect_error());
}

echo "=== VERIFICACION DE IMAGENES ===\n\n";

// Obtener productos con imágenes
$query = "SELECT id, name, codigo_interno, image FROM products WHERE image IS NOT NULL AND image != '' LIMIT 20";
$result = mysqli_query($conn, $query);

if ($result && mysqli_num_rows($result) > 0) {
    echo "Productos con imágenes:\n";
    echo str_repeat("-", 80) . "\n";
    
    while ($row = mysqli_fetch_assoc($result)) {
        $image = $row['image'];
        $file_exists = file_exists($_SERVER['DOCUMENT_ROOT'] . $image);
        
        echo sprintf(
            "ID: %d | Código: %s\nNombre: %s\nImagen: %s\nExiste: %s\n\n",
            $row['id'],
            $row['codigo_interno'] ?? 'N/A',
            $row['name'],
            $image,
            $file_exists ? 'SI' : 'NO'
        );
    }
} else {
    echo "No se encontraron productos con imágenes\n";
}

// Verificar patrones de rutas
echo "\n=== ANALISIS DE RUTAS ===\n\n";

$query = "SELECT DISTINCT image FROM products WHERE image IS NOT NULL AND image != '' AND image NOT LIKE '%placeholder%' LIMIT 10";
$result = mysqli_query($conn, $query);

if ($result && mysqli_num_rows($result) > 0) {
    echo "Ejemplos de rutas almacenadas:\n";
    while ($row = mysqli_fetch_assoc($result)) {
        echo "  - " . $row['image'] . "\n";
    }
}

mysqli_close($conn);
?>

