<?php
$config = require __DIR__ . '/config.php';

function db_connect(array $config): PDO {
  static $pdo = null;
  if ($pdo instanceof PDO) {
    return $pdo;
  }

  $dsn = sprintf('mysql:host=%s;dbname=%s;charset=utf8mb4', $config['db_host'], $config['db_name']);
  $pdo = new PDO($dsn, $config['db_user'], $config['db_pass'], [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
  ]);
  return $pdo;
}

function json_input(): array {
  $raw = file_get_contents('php://input');
  $data = json_decode($raw ?: '{}', true);
  return is_array($data) ? $data : [];
}

function json_response(array $data, int $status = 200): void {
  http_response_code($status);
  header('Content-Type: application/json');
  echo json_encode($data);
  exit;
}

function base64url_encode(string $input): string {
  return rtrim(strtr(base64_encode($input), '+/', '-_'), '=');
}

function base64url_decode(string $input): string {
  $remainder = strlen($input) % 4;
  if ($remainder > 0) {
    $input .= str_repeat('=', 4 - $remainder);
  }
  return base64_decode(strtr($input, '-_', '+/')) ?: '';
}

function jwt_sign(array $payload, string $secret): string {
  $header = ['alg' => 'HS256', 'typ' => 'JWT'];
  $segments = [
    base64url_encode(json_encode($header)),
    base64url_encode(json_encode($payload)),
  ];
  $signature = hash_hmac('sha256', implode('.', $segments), $secret, true);
  $segments[] = base64url_encode($signature);
  return implode('.', $segments);
}

function jwt_verify(string $jwt, string $secret): ?array {
  $parts = explode('.', $jwt);
  if (count($parts) !== 3) return null;

  [$h, $p, $s] = $parts;
  $expected = base64url_encode(hash_hmac('sha256', "$h.$p", $secret, true));
  if (!hash_equals($expected, $s)) return null;

  $payload = json_decode(base64url_decode($p), true);
  if (!is_array($payload)) return null;
  if (!empty($payload['exp']) && time() >= (int)$payload['exp']) return null;
  return $payload;
}

function get_bearer_token(): ?string {
  $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
  if (preg_match('/Bearer\s+(.+)/i', $header, $m)) {
    return trim($m[1]);
  }
  return null;
}
