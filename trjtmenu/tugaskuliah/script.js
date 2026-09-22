// ================================================================
//  TUGAS KULIAH — script.js
//  Logic: UNCHANGED (Google Sheets + Telegram API intact)
//  Polish: smooth UX feedback added
// ================================================================

// --- Ambil Elemen DOM ---
const form            = document.getElementById('task-form');
const loadingOverlay  = document.getElementById('loading-overlay');
const popupSuccess    = document.getElementById('popup-success');
const closePopup      = document.getElementById('close-popup');

// --- Endpoint / Token (TIDAK DIUBAH) ---
const scriptURL       = 'https://script.google.com/macros/s/AKfycbx5JvuMzCuZKFcGprtVJQd47GZcIMtt9ucCpZRLyI63MKVUYIBh9wkNounL7RB6_A-N/exec';
const telegramBotToken = '8217981437:AAEXx2Tdv_fMN-QuId4xkBoUQwAZIQpj8XA';
const telegramChatId   = '@fyi24a_bot';

// --- Referensi textarea & radio ---
const tugasDiberikan = document.getElementById('TugasDiberikan');
const formatRadios   = document.querySelectorAll('input[name="text-format"]');
let selectedFormat   = document.querySelector('input[name="text-format"]:checked').value;

// ================================================================
//  §1  AUTO-DATE — Isi tanggal otomatis saat halaman dimuat
// ================================================================
document.addEventListener('DOMContentLoaded', () => {
  const today    = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 7);

  const formatDate = date => {
    const yyyy = date.getFullYear();
    const mm   = String(date.getMonth() + 1).padStart(2, '0');
    const dd   = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const inputDiberikan    = document.getElementById('TanggalDiberikan');
  const inputDikumpulkan  = document.getElementById('TanggalDikumpulkan');

  if (inputDiberikan && inputDikumpulkan) {
    inputDiberikan.value   = formatDate(today);
    inputDikumpulkan.value = formatDate(nextWeek);
  }
});

// ================================================================
//  §2  TEXT FORMAT — Fungsi format teks (TIDAK DIUBAH)
// ================================================================
function toCapitalize(text) {
  return text.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

function toTitleCase(text) {
  const minor = ['dan', 'di', 'ke', 'yang', 'dari', 'untuk', 'atau', 'pada'];
  return text.toLowerCase().split(' ')
    .map((w, i) => i === 0 || !minor.includes(w)
      ? w.charAt(0).toUpperCase() + w.slice(1)
      : w)
    .join(' ');
}

function applyFormat() {
  let txt = tugasDiberikan.value;
  switch (selectedFormat) {
    case 'uppercase':  txt = txt.toUpperCase();  break;
    case 'lowercase':  txt = txt.toLowerCase();  break;
    case 'capitalize': txt = toCapitalize(txt);  break;
    case 'title':      txt = toTitleCase(txt);   break;
    default: break;
  }
  tugasDiberikan.value = txt;
}

// Event listener format radio
formatRadios.forEach(r => r.addEventListener('change', () => {
  selectedFormat = r.value;
  applyFormat();
}));

// Terapkan format saat mengetik
tugasDiberikan.addEventListener('input', applyFormat);

// ================================================================
//  §3  FORM SUBMIT — Kirim ke Google Sheets + Telegram
//      KONEKSI DAN LOGIKA TIDAK DIUBAH
// ================================================================
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Tampilkan loading
  loadingOverlay.classList.add('active');

  const formData  = new FormData(form);
  const tugasText = tugasDiberikan.value;
  formData.set('Tugas Yang Diberikan', tugasText);
  const data = Object.fromEntries(formData.entries());

  // Susun caption Telegram
  const caption = `
🔔 Tugas Kuliah Baru

📅 Diberikan   : ${data['Diberikan']}
📅 Dikumpulkan : ${data['Dikumpulkan']}
📚 Pertemuan   : ${data['Pertemuan']}
📝 MK          : ${data['MK']}

📋 Tugas:

${tugasText}
`.trim();

  try {
    // ── Kirim ke Google Sheets ──
    await fetch(scriptURL, {
      method: 'POST',
      body: formData
    });

    // ── Kirim ke Telegram ──
    await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id:    telegramChatId,
        text:       `<pre>${caption}</pre>`,
        parse_mode: 'HTML'
      })
    });

    // ── Sukses ──
    loadingOverlay.classList.remove('active');
    popupSuccess.classList.add('open');
    form.reset();

    // Auto-tutup popup setelah 4 detik
    setTimeout(() => {
      popupSuccess.classList.remove('open');
    }, 4000);

  } catch (err) {
    loadingOverlay.classList.remove('active');
    alert('❌ Gagal mengirim data! Periksa koneksi internet Anda.');
    console.error('[Submit Error]', err);
  }
});

// ================================================================
//  §4  POPUP — Tutup manual
// ================================================================
closePopup.addEventListener('click', () => {
  popupSuccess.classList.remove('open');
});

// Tutup juga jika klik overlay di luar popup box
popupSuccess.addEventListener('click', (e) => {
  if (e.target === popupSuccess) {
    popupSuccess.classList.remove('open');
  }
});
