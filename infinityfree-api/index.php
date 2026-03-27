<?php
require __DIR__ . '/db.php';

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigin = $config['allowed_origin'] ?? '*';
if ($allowedOrigin === '*' || $origin === $allowedOrigin) {
  header('Access-Control-Allow-Origin: ' . ($allowedOrigin === '*' ? '*' : $origin));
}
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

$pdo = db_connect($config);
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/';
$path = preg_replace('#^/+#', '/', $path);

function route_path(string $path): string {
  $parts = explode('/', trim($path, '/'));
  $n = count($parts);
  if ($n >= 2) {
    return '/' . $parts[$n - 2] . '/' . $parts[$n - 1];
  }
  return '/' . trim($path, '/');
}

$route = route_path($path);

if ($route === '/health' && $_SERVER['REQUEST_METHOD'] === 'GET') {
  json_response(['ok' => true, 'service' => 'infinityfree-api']);
}

if ($route === '/auth/register' && $_SERVER['REQUEST_METHOD'] === 'POST') {
  $body = json_input();
  $name = trim((string)($body['name'] ?? ''));
  $email = strtolower(trim((string)($body['email'] ?? '')));
  $password = (string)($body['password'] ?? '');

  if ($name === '' || $email === '' || strlen($password) < 6) {
    json_response(['error' => 'Invalid input'], 422);
  }

  $exists = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
  $exists->execute([$email]);
  if ($exists->fetch()) {
    json_response(['error' => 'Email already exists'], 409);
  }

  $hash = password_hash($password, PASSWORD_BCRYPT);
  $insert = $pdo->prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)');
  $insert->execute([$name, $email, $hash]);
  $userId = (int)$pdo->lastInsertId();

  $payload = ['uid' => (string)$userId, 'email' => $email, 'name' => $name, 'exp' => time() + (7 * 24 * 3600)];
  $token = jwt_sign($payload, $config['jwt_secret']);

  json_response([
    'token' => $token,
    'user' => [
      'uid' => (string)$userId,
      'displayName' => $name,
      'email' => $email,
      'role' => 'admin',
    ],
  ]);
}

if ($route === '/auth/login' && $_SERVER['REQUEST_METHOD'] === 'POST') {
  $body = json_input();
  $email = strtolower(trim((string)($body['email'] ?? '')));
  $password = (string)($body['password'] ?? '');

  $stmt = $pdo->prepare('SELECT id, name, email, password_hash FROM users WHERE email = ? LIMIT 1');
  $stmt->execute([$email]);
  $user = $stmt->fetch();
  if (!$user || !password_verify($password, $user['password_hash'])) {
    json_response(['error' => 'Invalid credentials'], 401);
  }

  $payload = ['uid' => (string)$user['id'], 'email' => $user['email'], 'name' => $user['name'], 'exp' => time() + (7 * 24 * 3600)];
  $token = jwt_sign($payload, $config['jwt_secret']);

  json_response([
    'token' => $token,
    'user' => [
      'uid' => (string)$user['id'],
      'displayName' => $user['name'],
      'email' => $user['email'],
      'role' => 'admin',
    ],
  ]);
}

$token = get_bearer_token();
$claims = $token ? jwt_verify($token, $config['jwt_secret']) : null;
if (!$claims) {
  json_response(['error' => 'Unauthorized'], 401);
}
$userId = (int)$claims['uid'];

if ($route === '/sync/pull' && $_SERVER['REQUEST_METHOD'] === 'GET') {
  $stmt = $pdo->prepare('SELECT payload_json FROM app_data WHERE user_id = ? LIMIT 1');
  $stmt->execute([$userId]);
  $row = $stmt->fetch();
  if (!$row) {
    json_response(['products' => [], 'sales' => [], 'customers' => [], 'profile' => null]);
  }

  $payload = json_decode((string)$row['payload_json'], true);
  if (!is_array($payload)) {
    json_response(['products' => [], 'sales' => [], 'customers' => [], 'profile' => null]);
  }
  json_response($payload);
}

if ($route === '/sync/push' && $_SERVER['REQUEST_METHOD'] === 'POST') {
  $body = json_input();
  $safePayload = [
    'products' => is_array($body['products'] ?? null) ? $body['products'] : [],
    'sales' => is_array($body['sales'] ?? null) ? $body['sales'] : [],
    'customers' => is_array($body['customers'] ?? null) ? $body['customers'] : [],
    'profile' => is_array($body['profile'] ?? null) ? $body['profile'] : null,
  ];
  $json = json_encode($safePayload);

  $stmt = $pdo->prepare('INSERT INTO app_data (user_id, payload_json, updated_at) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE payload_json = VALUES(payload_json), updated_at = NOW()');
  $stmt->execute([$userId, $json]);
  json_response(['ok' => true]);
}

json_response(['error' => 'Not found'], 404);
