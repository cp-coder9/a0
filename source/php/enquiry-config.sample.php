<?php
// Copy this file to /home/<cpanel-user>/enquiry-config.php (one level ABOVE public_html) and
// fill in the real SMTP credentials. Never place it inside the public web root.
return [
    'smtp_host'   => 'mail.trukafrik.com',
    'smtp_port'   => 587,
    'smtp_mode'   => 'starttls', // 'starttls' for 587, 'ssl' for 465
    'smtp_user'   => 'website@trukafrik.com',
    'smtp_pass'   => 'REPLACE-WITH-SMTP-PASSWORD',
    'smtp_from'   => 'website@trukafrik.com',
    'enquiry_to'  => 'chris@trukafrik.com',
    'allowed_origins' => ['https://www.trukafrik.com', 'https://trukafrik.com'],
    'rate_limit'  => 5,
    'rate_window_minutes' => 10,
];
