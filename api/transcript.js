// Vercel Serverless Function: api/transcript.js

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { v, videoId: vId, url, lang } = req.query;
    const input = v || vId || url || '';

    if (!input) {
        return res.status(400).json({
            success: false,
            error: 'Parameter URL atau Video ID tidak boleh kosong.'
        });
    }

    // Extract 11-char video ID
    let videoId = input;
    if (!/^[a-zA-Z0-9_-]{11}$/.test(input)) {
        const match = input.match(/(?:youtube\.com\/(?:watch\?.*v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
        if (match && match[1]) {
            videoId = match[1];
        } else {
            return res.status(400).json({
                success: false,
                error: 'URL YouTube tidak valid atau Video ID tidak ditemukan.'
            });
        }
    }

    try {
        const endpoint = 'https://www.youtube.com/youtubei/v1/player';
        const bodyPayload = JSON.stringify({
            context: {
                client: {
                    clientName: 'ANDROID',
                    clientVersion: '20.10.38',
                    hl: 'id',
                    gl: 'ID'
                }
            },
            videoId: videoId
        });

        const playerRes = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'com.google.android.youtube/20.10.38 (Linux; U; Android 14; Pixel 8 Pro) gzip'
            },
            body: bodyPayload
        });

        if (!playerRes.ok) {
            return res.status(502).json({
                success: false,
                error: `Gagal menghubungi server YouTube (Status ${playerRes.status}).`
            });
        }

        const data = await playerRes.json();
        const title = data.videoDetails?.title || 'YouTube Video';
        const author = data.videoDetails?.author || '';
        const lengthSeconds = parseInt(data.videoDetails?.lengthSeconds || 0);
        const captionTracks = data.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];

        if (captionTracks.length === 0) {
            return res.status(200).json({
                success: false,
                hasCaptions: false,
                videoId: videoId,
                title: title,
                author: author,
                lengthSeconds: lengthSeconds,
                error: 'Video ini tidak memiliki subtitle atau transkrip (baik manual maupun otomatis).'
            });
        }

        const tracks = captionTracks.map(t => ({
            languageCode: t.languageCode,
            name: t.name?.simpleText || t.name?.runs?.[0]?.text || t.languageCode,
            baseUrl: t.baseUrl,
            isAuto: t.kind === 'asr'
        }));

        let selectedTrack = tracks[0];
        if (lang) {
            const found = tracks.find(t => t.languageCode === lang);
            if (found) selectedTrack = found;
        } else {
            const idTrack = tracks.find(t => t.languageCode === 'id');
            if (idTrack) selectedTrack = idTrack;
        }

        // Fetch timedtext XML from YouTube
        const capRes = await fetch(selectedTrack.baseUrl, {
            headers: {
                'User-Agent': 'com.google.android.youtube/20.10.38 (Linux; U; Android 14; Pixel 8 Pro)'
            }
        });

        const xml = await capRes.text();
        const segments = [];
        let fullText = '';

        // Parse <p t="startMs" d="durMs">Text</p>
        const pRegex = /<p\s+t="(\d+)"(?:\s+d="(\d+)")?[^>]*>(.*?)<\/p>/gis;
        let match;
        while ((match = pRegex.exec(xml)) !== null) {
            const startMs = parseInt(match[1]);
            const durMs = parseInt(match[2] || 0);
            let text = match[3]
                .replace(/<[^>]+>/g, '')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&#39;/g, "'")
                .replace(/&quot;/g, '"')
                .replace(/\s+/g, ' ')
                .trim();

            if (text) {
                segments.push({
                    start: Math.round((startMs / 1000) * 100) / 100,
                    duration: Math.round((durMs / 1000) * 100) / 100,
                    text: text
                });
                fullText += (fullText ? ' ' : '') + text;
            }
        }

        return res.status(200).json({
            success: true,
            hasCaptions: true,
            videoId: videoId,
            title: title,
            author: author,
            lengthSeconds: lengthSeconds,
            currentLanguage: selectedTrack.languageCode,
            tracks: tracks.map(t => ({
                languageCode: t.languageCode,
                name: t.name,
                isAuto: t.isAuto
            })),
            totalSegments: segments.length,
            fullText: fullText,
            segments: segments
        });

    } catch (err) {
        console.error('Transcript API Error:', err);
        return res.status(500).json({
            success: false,
            error: 'Terjadi kesalahan saat memproses transkrip: ' + err.message
        });
    }
}
