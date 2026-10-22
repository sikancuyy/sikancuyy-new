<?php
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    exit(0);
}

// Extract video ID from param or URL
$input = $_GET['v'] ?? $_GET['videoId'] ?? $_GET['url'] ?? '';
$lang = $_GET['lang'] ?? '';

if (empty($input)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Parameter URL atau Video ID tidak boleh kosong.']);
    exit;
}

// Function to extract 11-char video ID from various YouTube URL formats
function extractVideoId($url) {
    if (preg_match('/^[a-zA-Z0-9_-]{11}$/', $url)) {
        return $url;
    }
    $patterns = [
        '/(?:youtube\.com\/(?:watch\?.*v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i',
        '/^[a-zA-Z0-9_-]{11}$/'
    ];
    foreach ($patterns as $pattern) {
        if (preg_match($pattern, $url, $matches)) {
            return $matches[1];
        }
    }
    return false;
}

$videoId = extractVideoId($input);
if (!$videoId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'URL YouTube tidak valid atau Video ID tidak ditemukan.']);
    exit;
}

// Request Innertube Player API using Android client context
$endpoint = 'https://www.youtube.com/youtubei/v1/player';
$payload = json_encode([
    'context' => [
        'client' => [
            'clientName' => 'ANDROID',
            'clientVersion' => '20.10.38',
            'hl' => 'id',
            'gl' => 'ID'
        ]
    ],
    'videoId' => $videoId
]);

$ch = curl_init($endpoint);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $payload,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'User-Agent: com.google.android.youtube/20.10.38 (Linux; U; Android 14; Pixel 8 Pro) gzip'
    ],
    CURLOPT_TIMEOUT => 12,
    CURLOPT_SSL_VERIFYPEER => false
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($response === false || $httpCode !== 200) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Gagal menghubungi server YouTube: ' . ($curlError ?: "HTTP Code $httpCode")
    ]);
    exit;
}

$playerData = json_decode($response, true);
if (!$playerData) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Gagal memproses data JSON dari YouTube.']);
    exit;
}

$title = $playerData['videoDetails']['title'] ?? 'YouTube Video';
$author = $playerData['videoDetails']['author'] ?? '';
$lengthSeconds = $playerData['videoDetails']['lengthSeconds'] ?? 0;
$captionTracks = $playerData['captions']['playerCaptionsTracklistRenderer']['captionTracks'] ?? [];

if (empty($captionTracks)) {
    echo json_encode([
        'success' => false,
        'hasCaptions' => false,
        'videoId' => $videoId,
        'title' => $title,
        'author' => $author,
        'lengthSeconds' => (int)$lengthSeconds,
        'error' => 'Video ini tidak memiliki subtitle atau transkrip (baik manual maupun otomatis).'
    ]);
    exit;
}

// Available tracks list
$tracksList = [];
$selectedTrack = null;

foreach ($captionTracks as $track) {
    $code = $track['languageCode'] ?? '';
    $name = $track['name']['simpleText'] ?? ($track['name']['runs'][0]['text'] ?? $code);
    $isAuto = isset($track['kind']) && $track['kind'] === 'asr';
    
    $trackInfo = [
        'languageCode' => $code,
        'name' => $name . ($isAuto ? ' (Otomatis)' : ''),
        'baseUrl' => $track['baseUrl'] ?? '',
        'isAuto' => $isAuto
    ];
    $tracksList[] = $trackInfo;

    if ($selectedTrack === null) {
        $selectedTrack = $trackInfo;
    }
    // Match requested language if specified
    if (!empty($lang) && $code === $lang) {
        $selectedTrack = $trackInfo;
    }
}

// If no specific language requested, prefer Indonesian or English if available
if (empty($lang)) {
    foreach ($tracksList as $t) {
        if ($t['languageCode'] === 'id') {
            $selectedTrack = $t;
            break;
        }
    }
}

if (!$selectedTrack || empty($selectedTrack['baseUrl'])) {
    http_response_code(404);
    echo json_encode(['success' => false, 'error' => 'Jalur transkrip tidak ditemukan.']);
    exit;
}

// Fetch transcript XML / format from baseUrl
$captionUrl = $selectedTrack['baseUrl'];
$chCap = curl_init($captionUrl);
curl_setopt_array($chCap, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'User-Agent: com.google.android.youtube/20.10.38 (Linux; U; Android 14; Pixel 8 Pro)'
    ],
    CURLOPT_TIMEOUT => 12,
    CURLOPT_SSL_VERIFYPEER => false
]);

$captionRaw = curl_exec($chCap);
curl_close($chCap);

if (empty($captionRaw)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Gagal mengunduh teks transkrip dari YouTube.']);
    exit;
}

// Parse timedtext XML
$segments = [];
$fullText = '';

if (strpos($captionRaw, '<timedtext') !== false || strpos($captionRaw, '<transcript') !== false) {
    libxml_use_internal_errors(true);
    $xml = simplexml_load_string($captionRaw);
    
    if ($xml !== false && isset($xml->body->p)) {
        foreach ($xml->body->p as $p) {
            $attrs = $p->attributes();
            // t is start in milliseconds
            $startMs = (float)($attrs['t'] ?? 0);
            $durMs = (float)($attrs['d'] ?? 0);
            $text = html_entity_decode((string)$p, ENT_QUOTES | ENT_HTML5, 'UTF-8');
            $text = trim(preg_replace('/\s+/', ' ', $text));
            
            if ($text !== '') {
                $segments[] = [
                    'start' => round($startMs / 1000, 2),
                    'duration' => round($durMs / 1000, 2),
                    'text' => $text
                ];
                $fullText .= ($fullText === '' ? '' : ' ') . $text;
            }
        }
    } elseif ($xml !== false && isset($xml->text)) {
        // Standard transcript format <text start="1.2" dur="3.4">
        foreach ($xml->text as $tNode) {
            $attrs = $tNode->attributes();
            $startSec = (float)($attrs['start'] ?? 0);
            $durSec = (float)($attrs['dur'] ?? 0);
            $text = html_entity_decode((string)$tNode, ENT_QUOTES | ENT_HTML5, 'UTF-8');
            $text = trim(preg_replace('/\s+/', ' ', $text));
            
            if ($text !== '') {
                $segments[] = [
                    'start' => round($startSec, 2),
                    'duration' => round($durSec, 2),
                    'text' => $text
                ];
                $fullText .= ($fullText === '' ? '' : ' ') . $text;
            }
        }
    }
}

if (empty($segments)) {
    // Fallback regex parsing if simplexml encountered edge cases
    if (preg_match_all('/<p\s+t="(\d+)"(?:\s+d="(\d+)")?[^>]*>(.*?)<\/p>/is', $captionRaw, $pMatches, PREG_SET_ORDER)) {
        foreach ($pMatches as $pm) {
            $startMs = (float)$pm[1];
            $durMs = (float)($pm[2] ?? 0);
            $text = strip_tags($pm[3]);
            $text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
            $text = trim(preg_replace('/\s+/', ' ', $text));
            if ($text !== '') {
                $segments[] = [
                    'start' => round($startMs / 1000, 2),
                    'duration' => round($durMs / 1000, 2),
                    'text' => $text
                ];
                $fullText .= ($fullText === '' ? '' : ' ') . $text;
            }
        }
    }
}

echo json_encode([
    'success' => true,
    'hasCaptions' => true,
    'videoId' => $videoId,
    'title' => $title,
    'author' => $author,
    'lengthSeconds' => (int)$lengthSeconds,
    'currentLanguage' => $selectedTrack['languageCode'],
    'tracks' => array_map(function($t) {
        return [
            'languageCode' => $t['languageCode'],
            'name' => $t['name'],
            'isAuto' => $t['isAuto']
        ];
    }, $tracksList),
    'totalSegments' => count($segments),
    'fullText' => $fullText,
    'segments' => $segments
], JSON_UNESCAPED_UNICODE);
