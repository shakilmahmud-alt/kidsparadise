<?php
/**
 * KidsParadise High-Performance PHP Database Bridge & API
 * Deploy this file to your cPanel public_html/api.php
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Secret');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 1. Database Credentials (cPanel Localhost Connection)
$dbHost = 'localhost';
$dbName = 'kidspara_newversion';
$dbUser = 'kidspara_wp849';
$dbPass = ')2S-l4vp4c';
$dbPort = 3306;

// Security Secret for SQL Query Bridge (Must match JWT_SECRET in .env)
$bridgeSecret = 'kidsparadise_jwt_secret_key_2026';

// 2. PDO MySQL Connection
try {
    $dsn = "mysql:host={$dbHost};port={$dbPort};dbname={$dbName};charset=utf8mb4";
    $pdo = new PDO($dsn, $dbUser, $dbPass, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'error'   => 'Database connection failed',
        'message' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

// 3. Parse Request Input
$rawInput = file_get_contents('php://input');
$input = json_decode($rawInput, true) ?: [];
$action = $_GET['action'] ?? ($input['action'] ?? '');
$method = $_SERVER['REQUEST_METHOD'];

// 4. Health Check / Ping
if ($method === 'GET' && empty($action)) {
    try {
        $stmt = $pdo->query('SELECT COUNT(*) as product_count FROM products');
        $count = $stmt->fetchColumn();
        echo json_encode([
            'status'         => 'online',
            'message'        => 'KidsParadise cPanel Database Bridge is active',
            'products_count' => (int)$count,
            'timestamp'      => date('Y-m-d H:i:s')
        ]);
    } catch (Exception $e) {
        echo json_encode([
            'status'  => 'online_no_table',
            'message' => $e->getMessage()
        ]);
    }
    exit();
}

// 5. Image & Media Upload Handler (Uploads directly to cPanel uploads/ subfolders)
if ($action === 'upload') {
    if ($method !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        exit();
    }

    $raw = $input['file'] ?? ($input['data'] ?? '');
    $originalName = $input['name'] ?? ($_FILES['file']['name'] ?? ('media_' . time() . '.png'));
    $folder = preg_replace('/[^a-zA-Z0-9_-]/', '', $input['folder'] ?? ($_POST['folder'] ?? ''));

    $ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION)) ?: 'png';
    $videoExts = ['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv'];
    $allowed = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'pdf', 'mp4', 'webm', 'mov', 'avi', 'mkv', 'flv', 'zip', 'doc', 'docx', 'xlsx'];

    if (!in_array($ext, $allowed)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid file extension: ' . $ext]);
        exit();
    }

    // Auto assign folder by file type if not explicitly set
    if (empty($folder)) {
        if (in_array($ext, $videoExts)) {
            $folder = 'videos';
        } else {
            $folder = 'media';
        }
    }

    $baseUploadDir = __DIR__ . '/uploads/';
    $targetDir = $baseUploadDir . $folder . '/';

    if (!is_dir($targetDir)) {
        mkdir($targetDir, 0755, true);
    }

    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? "https://" : "http://";
    $host = $_SERVER['HTTP_HOST'];
    $cleanName = preg_replace('/[^a-zA-Z0-9_-]/', '_', pathinfo($originalName, PATHINFO_FILENAME));
    $fileName = 'kp_' . time() . '_' . substr($cleanName, 0, 35) . '.' . $ext;
    $targetPath = $targetDir . $fileName;
    $url = $protocol . $host . '/uploads/' . $folder . '/' . $fileName;

    $fileSize = 0;
    $saved = false;

    // Option A: Base64 JSON payload (100% ModSecurity-safe)
    if (!empty($raw)) {
        $base64Data = preg_replace('#^data:[^;]+;base64,#i', '', $raw);
        $binary = base64_decode($base64Data);

        if ($binary !== false && file_put_contents($targetPath, $binary)) {
            $fileSize = strlen($binary);
            $saved = true;
        }
    } 
    // Option B: Standard Multipart Form Data
    elseif (isset($_FILES['file'])) {
        if (move_uploaded_file($_FILES['file']['tmp_name'], $targetPath)) {
            $fileSize = filesize($targetPath);
            $saved = true;
        }
    }

    if ($saved) {
        $fileType = in_array($ext, $videoExts) ? ('video/' . $ext) : ($ext === 'pdf' ? 'application/pdf' : 'image/' . $ext);

        // Save to MySQL media table
        try {
            $stmt = $pdo->prepare('INSERT INTO media (name, url, file_type, size, created_at) VALUES (?, ?, ?, ?, NOW())');
            $stmt->execute([$originalName, $url, $fileType, $fileSize]);
        } catch (Exception $ex) {
            // Ignore if DB log fails
        }

        echo json_encode([
            'success' => true,
            'url' => $url,
            'name' => $originalName,
            'fileName' => $fileName,
            'folder' => $folder,
            'size' => $fileSize,
            'fileType' => $fileType,
            'createdAt' => date('Y-m-d H:i:s')
        ]);
        exit();
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to save file in cPanel folder: uploads/' . $folder]);
        exit();
    }
}

// 6. Generic SQL Bridge (For Node.js / Vercel Backend)
if ($action === 'query' || isset($input['sql'])) {
    $providedSecret = $_SERVER['HTTP_X_API_SECRET'] ?? ($input['secret'] ?? '');
    
    // Check Secret
    if ($providedSecret !== $bridgeSecret) {
        // Also allow Bearer token check
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if (str_replace('Bearer ', '', $authHeader) !== $bridgeSecret) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized SQL Bridge access']);
            exit();
        }
    }

    $sql = trim($input['sql'] ?? '');
    $params = $input['params'] ?? [];

    if (empty($sql)) {
        http_response_code(400);
        echo json_encode(['error' => 'SQL query cannot be empty']);
        exit();
    }

    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        $isSelect = preg_match('/^\s*(SELECT|SHOW|DESCRIBE|EXPLAIN)\b/i', $sql);
        $isInsert = preg_match('/^\s*INSERT\b/i', $sql);

        if ($isSelect) {
            $rows = $stmt->fetchAll();
            echo json_encode(['success' => true, 'results' => $rows], JSON_UNESCAPED_UNICODE);
        } elseif ($isInsert) {
            $insertId = (int)$pdo->lastInsertId();
            $affected = $stmt->rowCount();
            echo json_encode([
                'success' => true,
                'results' => [
                    'insertId'     => $insertId,
                    'affectedRows' => $affected
                ]
            ]);
        } else {
            $affected = $stmt->rowCount();
            echo json_encode([
                'success' => true,
                'results' => [
                    'affectedRows' => $affected
                ]
            ]);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'error'   => 'SQL Execution Error',
            'message' => $e->getMessage(),
            'query'   => $sql
        ], JSON_UNESCAPED_UNICODE);
    }
    exit();
}

// 7. Fallback: Full Store Data Endpoint
if ($action === 'store-data' || ($method === 'GET' && isset($_GET['store-data']))) {
    try {
        $products = $pdo->query('SELECT * FROM products ORDER BY created_at DESC')->fetchAll();
        $categories = $pdo->query('SELECT * FROM categories ORDER BY name ASC')->fetchAll();
        $brands = $pdo->query('SELECT * FROM brands ORDER BY name ASC')->fetchAll();
        $coupons = $pdo->query('SELECT * FROM coupons ORDER BY created_at DESC')->fetchAll();
        $reviews = $pdo->query('SELECT * FROM reviews ORDER BY created_at DESC')->fetchAll();
        $settings = $pdo->query('SELECT * FROM settings')->fetchAll();
        $attributes = $pdo->query('SELECT * FROM attributes ORDER BY name ASC')->fetchAll();
        $pages = $pdo->query('SELECT * FROM pages ORDER BY created_at DESC')->fetchAll();

        echo json_encode([
            'products'   => $products,
            'categories' => $categories,
            'brands'     => $brands,
            'coupons'    => $coupons,
            'reviews'    => $reviews,
            'settings'   => $settings,
            'attributes' => $attributes,
            'pages'      => $pages
        ], JSON_UNESCAPED_UNICODE);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit();
}

http_response_code(404);
echo json_encode(['error' => 'Endpoint not found']);
