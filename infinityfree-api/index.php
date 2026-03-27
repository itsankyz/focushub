<?php
require __DIR__ . '/db.php';

// CORS
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigin = $config['allowed_origin'] ?? '*';
if ($allowedOrigin === '*' || $origin === $allowedOrigin) {
  header('Access-Control-Allow-Origin: ' . ($allowedOrigin === '*' ? '*' : $origin));
}
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

// Parse route
$uri = $_SERVER['REQUEST_URI'] ?? '/';
$path = parse_url($uri, PHP_URL_PATH) ?: '/';

// Strip any leading path segments to get last two parts
// e.g. /api/health -> /health
//      /api/auth/login -> /auth/login
//      /htdocs/api/health -> /health
$parts = array_values(array_filter(explode('/', $path)));
$count = count($parts);

if ($count === 0) {
  $route = '/';
} elseif ($count === 1) {
  $route = '/' . $parts[0];
} else {
  $route = '/' . $parts[$count - 2] . '/' . $parts[$count - 1];
}

$method = $_SERVER['REQUEST_METHOD'];

// ── HEALTH (no DB, no auth) ──────────────────────────────────────────────────
if (($route === '/api/health' || $route === '/health' || $parts[$count-1] === 'health') && $method === 'GET') {
  echo json_encode(['ok' => true, 'service' => 'focushub-api']);
  exit;
}

// ── DB connection (needed for all routes below) ──────────────────────────────
$pdo = db_connect($config);

// ── REGISTER ─────────────────────────────────────────────────────────────────
if ($route === '/auth/register' && $method === 'POST') {
  $body = json_input();
  $name     = trim((string)($body['name'] ?? ''));
  $email    = strtolower(trim((string)($body['email'] ?? '')));
  $password = (string)($body['password'] ?? '');

  if ($name === '' || $email === '' || strlen($password) < 6) {
    json_response(['error' => 'Invalid input'], 422);
  }

  $exists = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
  $exists->execute([$email]);
  if ($exists->fetch()) {
    json_response(['error' => 'Email already exists'], 409);
  }

  $hash   = password_hash($password, PASSWORD_BCRYPT);
  $insert = $pdo->prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)');
  $insert->execute([$name, $email, $hash]);
  $userId = (int)$pdo->lastInsertId();

  $payload = ['uid' => (string)$userId, 'email' => $email, 'name' => $name, 'exp' => time() + 604800];
  $token   = jwt_sign($payload, $config['jwt_secret']);

  json_response([
    'token' => $token,
    'user'  => ['uid' => (string)$userId, 'displayName' => $name, 'email' => $email, 'role' => 'admin'],
  ]);
}

// ── LOGIN ─────────────────────────────────────────────────────────────────────
if ($route === '/auth/login' && $method === 'POST') {
  $body     = json_input();
  $email    = strtolower(trim((string)($body['email'] ?? '')));
  $password = (string)($body['password'] ?? '');

  $stmt = $pdo->prepare('SELECT id, name, email, password_hash FROM users WHERE email = ? LIMIT 1');
  $stmt->execute([$email]);
  $user = $stmt->fetch();

  if (!$user || !password_verify($password, $user['password_hash'])) {
    json_response(['error' => 'Invalid credentials'], 401);
  }

  $payload = ['uid' => (string)$user['id'], 'email' => $user['email'], 'name' => $user['name'], 'exp' => time() + 604800];
  $token   = jwt_sign($payload, $config['jwt_secret']);

  json_response([
    'token' => $token,
    'user'  => ['uid' => (string)$user['id'], 'displayName' => $user['name'], 'email' => $user['email'], 'role' => 'admin'],
  ]);
}

// ── AUTH MIDDLEWARE (all routes below require valid JWT) ──────────────────────
$rawToken = get_bearer_token();
$claims   = $rawToken ? jwt_verify($rawToken, $config['jwt_secret']) : null;
if (!$claims) {
  json_response(['error' => 'Unauthorized'], 401);
}
$userId = (int)$claims['uid'];

// ── SYNC PULL ─────────────────────────────────────────────────────────────────
if ($route === '/sync/pull' && $method === 'GET') {
  $stmt = $pdo->prepare('SELECT payload_json FROM app_data WHERE user_id = ? LIMIT 1');
  $stmt->execute([$userId]);
  $row = $stmt->fetch();

  if (!$row) {
    json_response(['products' => [], 'sales' => [], 'customers' => [], 'profile' => null]);
  }

  $payload = json_decode((string)$row['payload_json'], true);
  json_response(is_array($payload) ? $payload : ['products' => [], 'sales' => [], 'customers' => [], 'profile' => null]);
}

// ── SYNC PUSH ─────────────────────────────────────────────────────────────────
if ($route === '/sync/push' && $method === 'POST') {
  $body = json_input();
  $safe = [
    'products'  => is_array($body['products']  ?? null) ? $body['products']  : [],
    'sales'     => is_array($body['sales']     ?? null) ? $body['sales']     : [],
    'customers' => is_array($body['customers'] ?? null) ? $body['customers'] : [],
    'profile'   => is_array($body['profile']   ?? null) ? $body['profile']   : null,
  ];

  $stmt = $pdo->prepare('INSERT INTO app_data (user_id, payload_json, updated_at) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE payload_json = VALUES(payload_json), updated_at = NOW()');
  $stmt->execute([$userId, json_encode($safe)]);
  json_response(['ok' => true]);
}

json_response(['error' => 'Not found'], 404);
