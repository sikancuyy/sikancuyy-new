// YouTube Transkrip SikanCuyy - script.js

let currentVideoId = '';
let currentData = null;
let currentSegments = [];
let allTracks = [];

const urlInput = document.getElementById('youtubeUrl');
const submitBtn = document.getElementById('submitBtn');
const loadingBox = document.getElementById('loadingBox');
const errorBanner = document.getElementById('errorBanner');
const errorText = document.getElementById('errorText');
const videoSection = document.getElementById('videoSection');
const transcriptCard = document.getElementById('transcriptCard');
const playerIframe = document.getElementById('playerIframe');
const videoTitleEl = document.getElementById('videoTitle');
const videoAuthorEl = document.getElementById('videoAuthor');
const segmentCountEl = document.getElementById('segmentCount');
const wordCountEl = document.getElementById('wordCount');
const langSelect = document.getElementById('langSelect');
const langGroup = document.getElementById('langGroup');
const transcriptList = document.getElementById('transcriptList');
const searchInput = document.getElementById('searchInput');
const searchCount = document.getElementById('searchCount');
const toastEl = document.getElementById('toastMsg');

// Helper to extract video ID
function extractVideoId(url) {
    if (!url) return null;
    const clean = url.trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(clean)) {
        return clean;
    }
    const patterns = [
        /(?:youtube\.com\/(?:watch\?.*v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i,
        /youtube\.com\/watch\?.*[&?]v=([a-zA-Z0-9_-]{11})/i
    ];
    for (const p of patterns) {
        const match = clean.match(p);
        if (match && match[1]) {
            return match[1];
        }
    }
    return null;
}

// Paste from clipboard
async function pasteFromClipboard() {
    try {
        const text = await navigator.clipboard.readText();
        if (text) {
            urlInput.value = text.trim();
            handleFetchTranscript();
        }
    } catch (err) {
        showToast('Gagal membaca clipboard. Tempel secara manual.');
    }
}

// Quick load example
function loadExample(url) {
    urlInput.value = url;
    handleFetchTranscript();
}

// Show Toast
function showToast(msg) {
    if (!toastEl) return;
    toastEl.innerHTML = `<i class="fas fa-check-circle"></i> ${msg}`;
    toastEl.classList.add('show');
    setTimeout(() => {
        toastEl.classList.remove('show');
    }, 2800);
}

// Show error
function showError(msg) {
    if (!errorBanner) return;
    errorText.textContent = msg;
    errorBanner.style.display = 'flex';
    loadingBox.style.display = 'none';
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-magic"></i> Ambil Transkrip';
}

function hideError() {
    if (errorBanner) errorBanner.style.display = 'none';
}

// Format seconds into MM:SS or HH:MM:SS
function formatTime(seconds) {
    const s = Math.floor(seconds);
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    
    if (hrs > 0) {
        return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// Format seconds to SRT timestamp 00:00:00,000
function formatSrtTime(totalSec) {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = Math.floor(totalSec % 60);
    const ms = Math.floor((totalSec % 1) * 1000);
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

// Seek video to specific timestamp
function seekTo(seconds) {
    if (!playerIframe) return;
    // Send postMessage to YouTube Iframe
    playerIframe.contentWindow.postMessage(JSON.stringify({
        event: 'command',
        func: 'seekTo',
        args: [seconds, true]
    }), '*');
}

// Main fetch function
async function handleFetchTranscript(requestedLang = '') {
    hideError();
    const inputVal = urlInput.value.trim();
    const videoId = extractVideoId(inputVal);

    if (!videoId) {
        showError('URL YouTube tidak valid. Harap masukkan link video YouTube yang benar.');
        return;
    }

    currentVideoId = videoId;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
    loadingBox.style.display = 'block';
    transcriptCard.style.display = 'none';
    videoSection.style.display = 'none';

    try {
        let data = null;
        let isPhpHost = true;
        
        // 1. First attempt: call local api.php
        try {
            const apiUrl = `api.php?videoId=${encodeURIComponent(videoId)}${requestedLang ? '&lang=' + encodeURIComponent(requestedLang) : ''}`;
            const res = await fetch(apiUrl);
            if (res.ok) {
                const text = await res.text();
                // Check if server returned raw PHP file (static hosting like GitHub Pages)
                if (text.trim().startsWith('<?php')) {
                    isPhpHost = false;
                    console.warn('Server hosting tidak mengeksekusi PHP (hosting statis / GitHub Pages).');
                } else {
                    data = JSON.parse(text);
                }
            } else {
                isPhpHost = false;
            }
        } catch (phpErr) {
            isPhpHost = false;
            console.warn('Local api.php gagal atau tidak tersedia:', phpErr);
        }

        // 2. Client-side fallback if api.php not executed or failed
        if (!data || !data.success) {
            try {
                data = await fetchClientFallback(videoId, requestedLang);
            } catch (fallbackErr) {
                console.warn('Fallback error:', fallbackErr);
                if (!isPhpHost) {
                    showError(
                        'Hosting ini (misal: GitHub Pages / Statis) tidak mendukung eksekusi PHP (api.php), dan proxy publik diblokir oleh anti-bot YouTube. ' +
                        'Untuk hasil 100% lancar, jalankan web ini di Laragon/Localhost atau deploy ke web hosting yang mendukung PHP (seperti cPanel, InfinityFree gratis, atau VPS).'
                    );
                    return;
                }
                throw fallbackErr;
            }
        }

        if (!data || !data.success) {
            showError(data?.error || 'Gagal mengambil transkrip video ini.');
            return;
        }

        currentData = data;
        currentSegments = data.segments || [];
        allTracks = data.tracks || [];

        renderResult(data);

    } catch (err) {
        console.error(err);
        showError('Terjadi kesalahan saat memproses transkrip: ' + err.message);
    } finally {
        loadingBox.style.display = 'none';
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-magic"></i> Ambil Transkrip';
    }
}

// Client-side fallback using GET proxies to scrape watch page HTML
async function fetchClientFallback(videoId, requestedLang) {
    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const proxies = [
        `https://api.allorigins.win/raw?url=${encodeURIComponent(watchUrl)}`,
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(watchUrl)}`,
        `https://corsproxy.io/?${encodeURIComponent(watchUrl)}`
    ];

    let html = '';
    for (const pUrl of proxies) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);
            const res = await fetch(pUrl, { signal: controller.signal });
            clearTimeout(timeoutId);
            if (res.ok) {
                html = await res.text();
                if (html && html.includes('ytInitialPlayerResponse')) {
                    break;
                }
            }
        } catch (e) {
            // try next proxy
        }
    }

    if (!html || !html.includes('ytInitialPlayerResponse')) {
        throw new Error('Gagal mengambil data dari server YouTube.');
    }

    // Extract ytInitialPlayerResponse
    const match = html.match(/ytInitialPlayerResponse\s*=\s*({.+?})\s*;\s*(?:var\s+(?:meta|head)|<\/script|\n)/s) ||
                  html.match(/ytInitialPlayerResponse\s*=\s*({.+?});/s);
    if (!match) {
        throw new Error('Gagal membaca data player YouTube.');
    }

    const json = JSON.parse(match[1]);
    const title = json.videoDetails?.title || 'YouTube Video';
    const author = json.videoDetails?.author || '';
    const lengthSeconds = parseInt(json.videoDetails?.lengthSeconds || 0);
    const captionTracks = json.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];

    if (captionTracks.length === 0) {
        return {
            success: false,
            error: 'Video ini tidak memiliki subtitle atau transkrip (baik manual maupun otomatis).'
        };
    }

    const tracks = captionTracks.map(t => ({
        languageCode: t.languageCode,
        name: t.name?.simpleText || t.name?.runs?.[0]?.text || t.languageCode,
        baseUrl: t.baseUrl,
        isAuto: t.kind === 'asr'
    }));

    let selectedTrack = tracks[0];
    if (requestedLang) {
        const found = tracks.find(t => t.languageCode === requestedLang);
        if (found) selectedTrack = found;
    } else {
        const idTrack = tracks.find(t => t.languageCode === 'id');
        if (idTrack) selectedTrack = idTrack;
    }

    // Fetch the caption track XML
    const capProxies = [
        `https://api.allorigins.win/raw?url=${encodeURIComponent(selectedTrack.baseUrl)}`,
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(selectedTrack.baseUrl)}`,
        `https://corsproxy.io/?${encodeURIComponent(selectedTrack.baseUrl)}`
    ];

    let xmlText = '';
    for (const cpUrl of capProxies) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);
            const capRes = await fetch(cpUrl, { signal: controller.signal });
            clearTimeout(timeoutId);
            if (capRes.ok) {
                xmlText = await capRes.text();
                if (xmlText && (xmlText.includes('<timedtext') || xmlText.includes('<transcript') || xmlText.includes('<p '))) {
                    break;
                }
            }
        } catch (e) {
            // try next
        }
    }

    if (!xmlText) {
        throw new Error('Gagal mengunduh teks transkrip.');
    }

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    const pElements = xmlDoc.querySelectorAll('p, text');

    const segments = [];
    let fullText = '';

    pElements.forEach(el => {
        let start = 0;
        let dur = 0;
        if (el.hasAttribute('t')) {
            start = parseFloat(el.getAttribute('t')) / 1000;
            dur = parseFloat(el.getAttribute('d') || 0) / 1000;
        } else if (el.hasAttribute('start')) {
            start = parseFloat(el.getAttribute('start'));
            dur = parseFloat(el.getAttribute('dur') || 0);
        }
        const text = el.textContent.replace(/\s+/g, ' ').trim();
        if (text) {
            segments.push({
                start: Math.round(start * 100) / 100,
                duration: Math.round(dur * 100) / 100,
                text: text
            });
            fullText += (fullText ? ' ' : '') + text;
        }
    });

    return {
        success: true,
        videoId,
        title,
        author,
        lengthSeconds,
        currentLanguage: selectedTrack.languageCode,
        tracks,
        totalSegments: segments.length,
        fullText,
        segments
    };
}

// Render data onto UI
function renderResult(data) {
    // 1. Setup embedded player
    playerIframe.src = `https://www.youtube-nocookie.com/embed/${data.videoId}?enablejsapi=1&autoplay=0`;
    videoTitleEl.textContent = data.title;
    videoAuthorEl.textContent = data.author ? `Oleh: ${data.author}` : '';

    const wordCount = data.fullText ? data.fullText.trim().split(/\s+/).length : 0;
    segmentCountEl.innerHTML = `<i class="fas fa-list-ol"></i> ${data.totalSegments} baris`;
    wordCountEl.innerHTML = `<i class="fas fa-file-alt"></i> ~${wordCount.toLocaleString('id-ID')} kata`;

    // 2. Language Selector
    if (data.tracks && data.tracks.length > 1) {
        langGroup.style.display = 'flex';
        langSelect.innerHTML = data.tracks.map(t => `
            <option value="${t.languageCode}" ${t.languageCode === data.currentLanguage ? 'selected' : ''}>
                ${t.name}
            </option>
        `).join('');
    } else {
        langGroup.style.display = 'none';
    }

    // 3. Render transcript rows
    renderTranscriptRows(data.segments);

    // 4. Reveal sections
    videoSection.style.display = 'grid';
    videoSection.classList.add('has-video');
    transcriptCard.style.display = 'block';

    // Smooth scroll down to result
    transcriptCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Render transcript list items
function renderTranscriptRows(segments, query = '') {
    transcriptList.innerHTML = '';
    const qLower = query.toLowerCase().trim();
    let matchesCount = 0;

    segments.forEach((seg, idx) => {
        const text = seg.text;
        const isMatch = !qLower || text.toLowerCase().includes(qLower);

        if (isMatch) {
            matchesCount++;
            const row = document.createElement('div');
            row.className = 'transcript-item';
            row.title = 'Klik untuk putar video di detik ini';
            row.onclick = () => seekTo(seg.start);

            let displayText = escapeHtml(text);
            if (qLower) {
                const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
                displayText = displayText.replace(regex, '<mark class="highlight">$1</mark>');
            }

            row.innerHTML = `
                <span class="transcript-time">${formatTime(seg.start)}</span>
                <span class="transcript-text">${displayText}</span>
            `;
            transcriptList.appendChild(row);
        }
    });

    if (query) {
        searchCount.textContent = `${matchesCount} baris cocok`;
    } else {
        searchCount.textContent = `${segments.length} baris`;
    }

    if (matchesCount === 0) {
        transcriptList.innerHTML = `
            <div style="text-align: center; padding: 30px; color: var(--text-muted); font-size: 0.9rem;">
                <i class="fas fa-search" style="font-size: 1.5rem; margin-bottom: 8px; display: block;"></i>
                Tidak ditemukan baris yang cocok dengan kata kunci "<b>${escapeHtml(query)}</b>"
            </div>
        `;
    }
}

// Live search inside transcript
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const q = e.target.value;
        renderTranscriptRows(currentSegments, q);
    });
}

// Language change handler
if (langSelect) {
    langSelect.addEventListener('change', (e) => {
        const lang = e.target.value;
        handleFetchTranscript(lang);
    });
}

// URL enter key handler
if (urlInput) {
    urlInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleFetchTranscript();
        }
    });
}

// Copy Plain Text
function copyCleanText() {
    if (!currentData || !currentSegments.length) return;
    const text = currentSegments.map(s => s.text).join(' ');
    navigator.clipboard.writeText(text).then(() => {
        showToast('Transkrip bersih berhasil disalin!');
    });
}

// Copy with Timestamps
function copyWithTimestamps() {
    if (!currentData || !currentSegments.length) return;
    const text = currentSegments
        .map(s => `[${formatTime(s.start)}] ${s.text}`)
        .join('\n');
    navigator.clipboard.writeText(text).then(() => {
        showToast('Transkrip dengan timestamp disalin!');
    });
}

// Copy AI Prompt
function copyAiPrompt() {
    if (!currentData || !currentSegments.length) return;
    const cleanText = currentSegments.map(s => s.text).join(' ');
    const prompt = `Berikut adalah transkrip lengkap dari video YouTube berjudul "${currentData.title}":\n\n"""\n${cleanText}\n"""\n\nTolong buatkan:\n1. Ringkasan eksekutif (3-5 kalimat).\n2. Poin-poin penting / key takeaways secara terstruktur.\n3. Tindakan praktis (action items) jika ada.`;
    
    navigator.clipboard.writeText(prompt).then(() => {
        showToast('Format Prompt Ringkasan AI disalin!');
    });
}

// Download .TXT
function downloadTxt() {
    if (!currentData || !currentSegments.length) return;
    const content = `Judul: ${currentData.title}\nChannel: ${currentData.author}\nLink: https://youtube.com/watch?v=${currentData.videoId}\nTotal Segmen: ${currentSegments.length}\n\n========================================\nTRANSKRIP LENGKAP\n========================================\n\n` +
        currentSegments.map(s => `[${formatTime(s.start)}] ${s.text}`).join('\n');

    downloadFile(content, `${slugify(currentData.title)}-transkrip.txt`, 'text/plain');
    showToast('File .TXT berhasil diunduh!');
}

// Download .SRT
function downloadSrt() {
    if (!currentData || !currentSegments.length) return;
    let srtContent = '';
    currentSegments.forEach((seg, idx) => {
        const start = formatSrtTime(seg.start);
        const end = formatSrtTime(seg.start + (seg.duration || 2.5));
        srtContent += `${idx + 1}\n${start} --> ${end}\n${seg.text}\n\n`;
    });

    downloadFile(srtContent, `${slugify(currentData.title)}.srt`, 'text/plain');
    showToast('File subtitle .SRT berhasil diunduh!');
}

function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type: `${type};charset=utf-8;` });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function slugify(text) {
    return (text || 'youtube-video')
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 50);
}

function escapeHtml(string) {
    return String(string)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Theme handling
const body = document.body;
const icon = document.getElementById('toggleIcon');

if (localStorage.getItem('theme') === 'dark') {
    body.classList.add('dark');
    if (icon) icon.className = 'fas fa-sun';
}

function toggleDark() {
    body.classList.toggle('dark');
    const isDark = body.classList.contains('dark');
    if (icon) icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}
