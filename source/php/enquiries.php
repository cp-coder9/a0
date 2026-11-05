<?php
declare(strict_types=1);
/**
 * POST /api/enquiries — PHP replacement for app/api/enquiries/route.ts.
 * Same request body, validation messages, status codes and success shape as the Node route,
 * so the client code and tests stay unchanged.
 */

ini_set('display_errors', '0');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function enquiry_strlen(string $value): int
{
    return function_exists('mb_strlen') ? mb_strlen($value) : strlen($value);
}

function enquiry_respond(int $status, array $payload): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    enquiry_respond(405, ['error' => 'Method not allowed.']);
}

$configPath = getenv('TRUK_ENQUIRY_CONFIG') ?: dirname(__DIR__, 2) . '/enquiry-config.php';
if (!is_file($configPath)) {
    error_log('enquiry configuration missing at ' . $configPath);
    enquiry_respond(503, ['sent' => false, 'error' => 'Email is unavailable. Please call 0820748725 or try again later.']);
}
$config = require $configPath;

$allowedOrigins = (array)($config['allowed_origins'] ?? []);
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && !in_array($origin, $allowedOrigins, true)) {
    enquiry_respond(403, ['error' => 'Request origin not allowed.']);
}

$length = (int)($_SERVER['CONTENT_LENGTH'] ?? 0);
if ($length > 16384) {
    enquiry_respond(413, ['error' => 'Enquiry too large.']);
}
$raw = file_get_contents('php://input');
if ($raw === false || strlen($raw) > 16384) {
    enquiry_respond(413, ['error' => 'Enquiry too large.']);
}
try {
    $input = json_decode($raw, true, 8, JSON_THROW_ON_ERROR);
} catch (Throwable $error) {
    enquiry_respond(400, ['error' => 'Invalid JSON.']);
}
if (!is_array($input)) {
    enquiry_respond(400, ['errors' => ['name' => 'Enter your name (up to 120 characters).']]);
}

$trim = static function ($value): string {
    return is_string($value) ? trim($value) : '';
};
$data = [
    'name' => $trim($input['name'] ?? ''),
    'email' => $trim($input['email'] ?? ''),
    'phone' => $trim($input['phone'] ?? ''),
    'model' => $trim($input['model'] ?? ''),
    'message' => $trim($input['message'] ?? ''),
];

$errors = [];
if ($data['name'] === '' || enquiry_strlen($data['name']) > 120) {
    $errors['name'] = 'Enter your name (up to 120 characters).';
}
if (!preg_match('/^[^\s@]+@[^\s@]+\.[^\s@]+$/', $data['email']) || strlen($data['email']) > 254) {
    $errors['email'] = 'Enter a valid email address.';
}
if ($data['phone'] !== '' && !preg_match('/^[+()\d\s-]{7,30}$/', $data['phone'])) {
    $errors['phone'] = 'Enter a valid phone number.';
}
if (enquiry_strlen($data['model']) > 120) {
    $errors['model'] = 'Select a truck.';
}
if (enquiry_strlen($data['message']) > 2000) {
    $errors['message'] = 'Use no more than 2000 characters.';
}
if (($input['consent'] ?? null) !== true) {
    $errors['consent'] = 'Consent is required.';
}
if ($errors !== []) {
    enquiry_respond(400, ['errors' => $errors]);
}

// Simple per-IP throttle so the form cannot be used as an open relay.
$limit = max(1, (int)($config['rate_limit'] ?? 5));
$window = max(1, (int)($config['rate_window_minutes'] ?? 10)) * 60;
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$bucket = rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . 'truk-enquiry-' . sha1($ip) . '.json';
$now = time();
$hits = [];
if (is_file($bucket)) {
    $stored = json_decode((string)@file_get_contents($bucket), true);
    if (is_array($stored)) {
        $hits = array_values(array_filter($stored, static fn($t) => is_int($t) && $t > $now - $window));
    }
}
if (count($hits) >= $limit) {
    header('Retry-After: ' . $window);
    enquiry_respond(429, ['sent' => false, 'error' => 'Too many enquiries from this connection. Please try again later or call 0820748725.']);
}
$hits[] = $now;
@file_put_contents($bucket, json_encode($hits), LOCK_EX);

require __DIR__ . '/enquiry-mail.php';

try {
    $id = enquiry_smtp_send($config, $data);
    enquiry_respond(201, ['sent' => true, 'delivery' => 'email', 'id' => $id]);
} catch (Throwable $error) {
    error_log('enquiry SMTP failure: ' . $error->getMessage());
    enquiry_respond(503, ['sent' => false, 'error' => 'Email is unavailable. Please call 0820748725 or try again later.']);
}
