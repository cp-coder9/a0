<?php
declare(strict_types=1);
/**
 * Minimal SMTP client for shared hosting without Composer.
 * Mirrors lib/enquiry-mail.ts: same sender, recipient, subject, body and TLS expectations.
 */

function enquiry_expect($fp, array $codes): string
{
    $lines = [];
    while (($line = fgets($fp, 1024)) !== false) {
        $line = rtrim($line, "\r\n");
        $lines[] = $line;
        if (preg_match('/^\d{3} /', $line)) {
            break;
        }
    }
    if ($lines === []) {
        throw new RuntimeException('SMTP connection closed unexpectedly');
    }
    $code = (int)substr(end($lines), 0, 3);
    if (!in_array($code, $codes, true)) {
        throw new RuntimeException('SMTP error ' . $code . ': ' . substr(end($lines), 4, 120));
    }
    return implode("\n", $lines);
}

function enquiry_smtp_command($fp, string $command, array $codes): string
{
    fwrite($fp, $command . "\r\n");
    return enquiry_expect($fp, $codes);
}

function enquiry_header_safe(string $value): string
{
    return str_replace(["\r", "\n"], '', $value);
}

function enquiry_smtp_send(array $config, array $data): string
{
    $host = (string)$config['smtp_host'];
    $port = (int)$config['smtp_port'];
    $mode = (string)$config['smtp_mode'];

    $context = stream_context_create([
        'ssl' => [
            'verify_peer' => true,
            'verify_peer_name' => true,
            'allow_self_signed' => false,
            'min_version' => STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT,
            'peer_name' => $host,
        ],
    ]);
    $remote = ($mode === 'ssl' ? 'ssl://' : 'tcp://') . $host . ':' . $port;
    $fp = @stream_socket_client($remote, $errno, $errstr, 12, STREAM_CLIENT_CONNECT, $context);
    if ($fp === false) {
        throw new RuntimeException('SMTP connect failed: ' . ($errstr ?: (string)$errno));
    }
    stream_set_timeout($fp, 25);

    try {
        enquiry_expect($fp, [220]);
        $ehlo = 'EHLO ' . (gethostname() ?: 'trukafrik.com');
        enquiry_smtp_command($fp, $ehlo, [250]);

        // 'ssl' is implicit TLS on connect; 'starttls' upgrades after EHLO.
        // 'none' exists only for local verification against a mock SMTP (never in production config).
        if ($mode === 'starttls') {
            enquiry_smtp_command($fp, 'STARTTLS', [220]);
            if (!stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                throw new RuntimeException('SMTP STARTTLS failed');
            }
            enquiry_smtp_command($fp, $ehlo, [250]);
        }

        enquiry_smtp_command($fp, 'AUTH LOGIN', [334]);
        enquiry_smtp_command($fp, base64_encode((string)$config['smtp_user']), [334]);
        enquiry_smtp_command($fp, base64_encode((string)$config['smtp_pass']), [235]);

        $from = (string)$config['smtp_from'];
        $to = (string)$config['enquiry_to'];
        enquiry_smtp_command($fp, 'MAIL FROM:<' . $from . '>', [250]);
        enquiry_smtp_command($fp, 'RCPT TO:<' . $to . '>', [250, 251]);
        enquiry_smtp_command($fp, 'DATA', [354]);

        $model = $data['model'] !== '' ? $data['model'] : 'Not selected';
        $phone = $data['phone'] !== '' ? $data['phone'] : 'Not provided';
        $message = $data['message'] !== '' ? $data['message'] : 'Not provided';
        $body = "New website enquiry\n\n"
            . 'Selected model: ' . $model . "\n"
            . 'Name: ' . enquiry_header_safe($data['name']) . "\n"
            . 'Email: ' . $data['email'] . "\n"
            . 'Phone: ' . $phone . "\n\n"
            . "Message:\n" . $message . "\n\n"
            . "Consent to contact: Yes\n";

        $messageId = '<' . bin2hex(random_bytes(12)) . '@' . $host . '>';
        $headers = [
            'Date: ' . date('r'),
            'From: SITRAK website <' . $from . '>',
            'To: <' . $to . '>',
            'Reply-To: <' . $data['email'] . '>',
            'Subject: SITRAK website enquiry',
            'Message-ID: ' . $messageId,
            'MIME-Version: 1.0',
            'Content-Type: text/plain; charset=UTF-8',
            'Content-Transfer-Encoding: quoted-printable',
            'X-Mailer: trukafrik-site',
        ];

        fwrite($fp, implode("\r\n", $headers) . "\r\n\r\n"
            . quoted_printable_encode($body) . "\r\n.\r\n");
        enquiry_expect($fp, [250]);
        enquiry_smtp_command($fp, 'QUIT', [221]);

        return 'smtp-' . $messageId;
    } finally {
        if (is_resource($fp)) {
            fclose($fp);
        }
    }
}
