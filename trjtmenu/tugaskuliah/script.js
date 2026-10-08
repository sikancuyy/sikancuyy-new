// ================================================================
//  TUGAS KULIAH — script.js
//  Logic: Google Sheets + Telegram API + WhatsApp SikanBot (VPS)
//  Fitur: Pemilihan Grup WhatsApp Dinamis, Fallback Offline, & Config Bot
// ================================================================

// --- Ambil Elemen DOM ---
const form               = document.getElementById('task-form');
const loadingOverlay     = document.getElementById('loading-overlay');
const popupSuccess       = document.getElementById('popup-success');
const popupSuccessDesc   = document.getElementById('popup-success-desc');
const closePopup         = document.getElementById('close-popup');

// --- Elemen Notifikasi WhatsApp ---
const sendToWaCheckbox   = document.getElementById('sendToWa');
const waNotifyCard       = document.getElementById('wa-notify-card');
const waGroupWrapper     = document.getElementById('wa-group-wrapper');
const waGroupSelect      = document.getElementById('waGroupSelect');
const btnRefreshGroups   = document.getElementById('btn-refresh-groups');
const refreshIcon        = document.getElementById('refresh-icon');
const waBotStatusBadge   = document.getElementById('wa-bot-status-badge');
const manualGroupWrap    = document.getElementById('manual-group-wrap');
const manualGroupId      = document.getElementById('manualGroupId');

// --- Elemen Modal Pengaturan Bot ---
const btnWaSettings          = document.getElementById('btn-wa-settings');
const modalBotSettings       = document.getElementById('modal-bot-settings');
const btnCloseSettingsModal  = document.getElementById('btn-close-settings-modal');
const cfgBotUrl              = document.getElementById('cfg-bot-url');
const btnTestBotConn         = document.getElementById('btn-test-bot-conn');
const btnSaveBotCfg          = document.getElementById('btn-save-bot-cfg');
const testBotResult          = document.getElementById('test-bot-result');

// --- Endpoint / Token Asli ---
const scriptURL          = 'https://script.google.com/macros/s/AKfycbx5JvuMzCuZKFcGprtVJQd47GZcIMtt9ucCpZRLyI63MKVUYIBh9wkNounL7RB6_A-N/exec';
const telegramBotToken    = '8217981437:AAEXx2Tdv_fMN-QuId4xkBoUQwAZIQpj8XA';
const telegramChatId      = '@fyi24a_bot';

// --- Konfigurasi Endpoint SikanBot (VPS) ---
const DEFAULT_SIKANBOT_URL = 'https://treatments-gordon-areas-transaction.trycloudflare.com';
const FALLBACK_URL_VPS     = 'https://bot.sikancuyy.my.id';

function getSikanBotBaseUrl() {
  const saved = localStorage.getItem('sikanbot_url');
  if (saved && saved.trim()) {
    return saved.trim().replace(/\/+$/, '');
  }
  return DEFAULT_SIKANBOT_URL;
}

// Daftar grup cadangan jika bot offline / belum tersambung
const FALLBACK_GROUPS = [
  { id: '120363314636289389@g.us', name: 'TeeRJeTe 3A (Kelas Utama)', participantsCount: 18 },
  { id: '120363412565156974@g.us', name: 'Fyi Task Kuliah', participantsCount: 2 },
  { id: '6282278087620-1626411676@g.us', name: 'Networks.class', participantsCount: 24 },
  { id: '120363394108642282@g.us', name: 'Bro Code 3.4', participantsCount: 6 },
  { id: '120363341105980424@g.us', name: 'LAPEMDOS☠️', participantsCount: 11 },
  { id: '120363429415071733@g.us', name: 'Skibidiw💃', participantsCount: 7 },
  { id: '120363411249206158@g.us', name: 'Area ai', participantsCount: 3 },
  { id: '120363410324798446@g.us', name: 'Bott', participantsCount: 2 },
  { id: '120363428457399023@g.us', name: 'Pembuatan stiker', participantsCount: 2 }
];

// --- Referensi textarea & radio ---
const tugasDiberikan = document.getElementById('TugasDiberikan');
const formatRadios   = document.querySelectorAll('input[name="text-format"]');
let selectedFormat   = document.querySelector('input[name="text-format"]:checked')?.value || 'default';

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

  // Muat daftar grup WA dari SikanBot VPS
  loadWaGroups();
});

// ================================================================
//  §2  TEXT FORMAT — Fungsi format teks
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
  if (!tugasDiberikan) return;
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

formatRadios.forEach(r => r.addEventListener('change', () => {
  selectedFormat = r.value;
  applyFormat();
}));

if (tugasDiberikan) {
  tugasDiberikan.addEventListener('input', applyFormat);
}

// ================================================================
//  §3  LOAD & POPULATE WHATSAPP GROUPS DARI VPS BOT
// ================================================================
async function fetchWithTimeout(url, options = {}, timeoutMs = 6000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, credentials: 'omit', signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

async function loadWaGroups(isManualRefresh = false) {
  if (!waGroupSelect) return;

  if (refreshIcon) refreshIcon.classList.add('fa-spin');
  setBotBadge('loading', 'Memeriksa SikanBot...');

  const savedGroup = localStorage.getItem('sikanbot_selected_group') || '120363314636289389@g.us';
  const baseUrl = getSikanBotBaseUrl();
  let groupsData = null;
  let isFromApi = false;

  try {
    const res = await fetchWithTimeout(`${baseUrl}/api/groups`, {}, 6000);
    if (res.ok) {
      const json = await res.json();
      if (json.status && Array.isArray(json.groups) && json.groups.length > 0) {
        groupsData = json.groups;
        isFromApi = true;
      }
    }
  } catch (err) {
    console.warn('[SikanBot] Gagal mengambil grup via primary URL, mencoba fallback...', err.message);
    // Coba fallback URL
    if (baseUrl !== FALLBACK_URL_VPS) {
      try {
        const resFb = await fetchWithTimeout(`${FALLBACK_URL_VPS}/api/groups`, {}, 5000);
        if (resFb.ok) {
          const jsonFb = await resFb.json();
          if (jsonFb.status && Array.isArray(jsonFb.groups)) {
            groupsData = jsonFb.groups;
            isFromApi = true;
          }
        }
      } catch (fbErr) {
        console.warn('[SikanBot] Fallback URL juga gagal:', fbErr.message);
      }
    }
  }

  // Jika tetap gagal, gunakan grup cadangan yang sudah terdaftar
  if (!groupsData) {
    groupsData = FALLBACK_GROUPS;
    isFromApi = false;
  }

  // Populate Dropdown
  waGroupSelect.innerHTML = '';

  // 1. Opsi Kolektif (Semua Grup Kuliah)
  const optGroupQuick = document.createElement('optgroup');
  optGroupQuick.label = '⚡ Opsi Siar Cepat';
  const optAll = document.createElement('option');
  optAll.value = '__ALL_ACADEMIC__';
  optAll.textContent = '📢 Semua Grup Kuliah (TeeRJeTe 3A & Fyi Task)';
  optGroupQuick.appendChild(optAll);
  waGroupSelect.appendChild(optGroupQuick);

  // 2. Daftar Grup WhatsApp
  const optGroupList = document.createElement('optgroup');
  optGroupList.label = isFromApi ? `💬 Grup SikanBot Aktif (${groupsData.length})` : '💬 Daftar Grup Tersedia';

  let foundSaved = false;
  groupsData.forEach(g => {
    const opt = document.createElement('option');
    opt.value = g.id;
    const memberTxt = g.participantsCount ? ` (${g.participantsCount} org)` : '';
    opt.textContent = `${g.name}${memberTxt}`;
    if (g.id === savedGroup) {
      opt.selected = true;
      foundSaved = true;
    }
    optGroupList.appendChild(opt);
  });
  waGroupSelect.appendChild(optGroupList);

  // 3. Opsi Manual
  const optGroupManual = document.createElement('optgroup');
  optGroupManual.label = '⚙️ Kustom';
  const optManual = document.createElement('option');
  optManual.value = '__custom__';
  optManual.textContent = '➕ Masukkan ID Grup Lainnya (Manual)';
  optGroupManual.appendChild(optManual);
  waGroupSelect.appendChild(optGroupManual);

  if (savedGroup === '__ALL_ACADEMIC__') {
    optAll.selected = true;
  } else if (savedGroup === '__custom__') {
    optManual.selected = true;
    if (manualGroupWrap) manualGroupWrap.style.display = 'block';
  } else if (!foundSaved && waGroupSelect.options.length > 1) {
    // Default ke TeeRJeTe 3A jika ada
    const trjtOpt = [...waGroupSelect.options].find(o => o.value === '120363314636289389@g.us');
    if (trjtOpt) trjtOpt.selected = true;
  }

  // Update Badge status
  if (isFromApi) {
    setBotBadge('online', `🟢 Bot Online (${groupsData.length} Grup Siap)`);
  } else {
    setBotBadge('offline', `🟡 Mode Offline / Standby`);
  }

  if (refreshIcon) refreshIcon.classList.remove('fa-spin');
  if (isManualRefresh && isFromApi) {
    showToastNotification('✅ Daftar grup WhatsApp berhasil diperbarui!');
  }
}

function setBotBadge(type, text) {
  if (!waBotStatusBadge) return;
  waBotStatusBadge.className = type === 'online' ? 'wa-badge-online' : (type === 'loading' ? 'wa-badge-loading' : 'wa-badge-offline');
  waBotStatusBadge.innerHTML = `<i class="fa-solid fa-${type === 'loading' ? 'circle-notch fa-spin' : 'circle'}" style="font-size:0.55rem;"></i> ${text}`;
}

// Toggle switch Kirim WA
if (sendToWaCheckbox) {
  sendToWaCheckbox.addEventListener('change', () => {
    const isChecked = sendToWaCheckbox.checked;
    if (waNotifyCard) {
      if (isChecked) {
        waNotifyCard.classList.add('active-wa');
        if (waGroupWrapper) waGroupWrapper.style.opacity = '1';
        if (waGroupWrapper) waGroupWrapper.style.pointerEvents = 'auto';
      } else {
        waNotifyCard.classList.remove('active-wa');
        if (waGroupWrapper) waGroupWrapper.style.opacity = '0.5';
        if (waGroupWrapper) waGroupWrapper.style.pointerEvents = 'none';
      }
    }
  });
}

// Handler ganti grup
if (waGroupSelect) {
  waGroupSelect.addEventListener('change', () => {
    const val = waGroupSelect.value;
    if (val === '__custom__') {
      if (manualGroupWrap) manualGroupWrap.style.display = 'block';
      if (manualGroupId) manualGroupId.focus();
    } else {
      if (manualGroupWrap) manualGroupWrap.style.display = 'none';
      localStorage.setItem('sikanbot_selected_group', val);
    }
  });
}

// Tombol refresh grup
if (btnRefreshGroups) {
  btnRefreshGroups.addEventListener('click', () => loadWaGroups(true));
}

// ================================================================
//  §4  MODAL PENGATURAN BOT WA
// ================================================================
if (btnWaSettings && modalBotSettings) {
  btnWaSettings.addEventListener('click', () => {
    if (cfgBotUrl) cfgBotUrl.value = getSikanBotBaseUrl();
    if (testBotResult) testBotResult.style.display = 'none';
    modalBotSettings.classList.add('open');
  });
}

if (btnCloseSettingsModal && modalBotSettings) {
  btnCloseSettingsModal.addEventListener('click', () => {
    modalBotSettings.classList.remove('open');
  });
}

if (modalBotSettings) {
  modalBotSettings.addEventListener('click', (e) => {
    if (e.target === modalBotSettings) modalBotSettings.classList.remove('open');
  });
}

// Tes koneksi bot dari modal
if (btnTestBotConn && testBotResult) {
  btnTestBotConn.addEventListener('click', async () => {
    const testUrl = (cfgBotUrl.value || '').trim().replace(/\/+$/, '');
    if (!testUrl) {
      alert('Masukkan URL endpoint terlebih dahulu!');
      return;
    }
    btnTestBotConn.disabled = true;
    btnTestBotConn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menghubungi...';
    testBotResult.style.display = 'block';
    testBotResult.style.background = '#eff6ff';
    testBotResult.style.color = '#1e40af';
    testBotResult.innerHTML = 'Sedang mengetes koneksi ke server VPS...';

    try {
      const res = await fetchWithTimeout(`${testUrl}/api/status`, {}, 6000);
      const json = await res.json();
      if (json.status && json.botReady) {
        testBotResult.style.background = '#ecfdf5';
        testBotResult.style.color = '#065f46';
        testBotResult.innerHTML = `✅ <b>Koneksi Sukses!</b><br>Bot <b>${json.botName}</b> aktif di VPS.<br>Uptime: ${json.uptime}`;
      } else if (json.status) {
        testBotResult.style.background = '#fef3c7';
        testBotResult.style.color = '#92400e';
        testBotResult.innerHTML = `⚠️ <b>Server Aktif</b> tetapi WhatsApp belum login (Perlu Scan QR).`;
      } else {
        throw new Error('Format status tidak valid');
      }
    } catch (err) {
      testBotResult.style.background = '#fef2f2';
      testBotResult.style.color = '#991b1b';
      testBotResult.innerHTML = `❌ <b>Koneksi Gagal:</b> ${err.message}<br><small>Pastikan tunnel Cloudflare atau URL aktif.</small>`;
    } finally {
      btnTestBotConn.disabled = false;
      btnTestBotConn.innerHTML = '<i class="fa-solid fa-satellite-dish"></i> Tes Koneksi';
    }
  });
}

// Simpan config bot
if (btnSaveBotCfg && modalBotSettings) {
  btnSaveBotCfg.addEventListener('click', () => {
    const newUrl = (cfgBotUrl.value || '').trim().replace(/\/+$/, '');
    if (newUrl) {
      localStorage.setItem('sikanbot_url', newUrl);
    } else {
      localStorage.removeItem('sikanbot_url');
    }
    modalBotSettings.classList.remove('open');
    loadWaGroups(true);
  });
}

function showToastNotification(msg) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
    background: #1e293b; color: white; padding: 10px 20px;
    border-radius: 99px; font-size: 0.85rem; font-weight: 500;
    box-shadow: 0 10px 25px rgba(0,0,0,0.2); z-index: 99999;
    animation: fadeUp 0.3s ease both;
  `;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// ================================================================
//  §5  FORM SUBMIT — Kirim ke Google Sheets, Telegram & WhatsApp Grup
// ================================================================
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Tampilkan loading
  loadingOverlay.classList.add('active');

  const formData  = new FormData(form);
  const tugasText = tugasDiberikan ? tugasDiberikan.value : '';
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

  // Susun format pesan WhatsApp rapi
  const waCaption = `*🔔 TUGAS KULIAH BARU*

📅 *Diberikan*   : ${data['Diberikan']}
📅 *Dikumpulkan* : ${data['Dikumpulkan']}
📚 *Pertemuan*   : Pertemuan ${data['Pertemuan']}
📝 *Mata Kuliah* : *${data['MK']}*

📋 *Deskripsi Tugas:*
${tugasText}

_Pesan otomatis dari Web Input Tugas SikanCuyy_`;

  let waStatusReport = '';

  try {
    // ── 1. Kirim ke Google Sheets ──
    await fetch(scriptURL, {
      method: 'POST',
      body: formData
    });

    // ── 2. Kirim ke Telegram ──
    try {
      await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id:    telegramChatId,
          text:       `<pre>${caption}</pre>`,
          parse_mode: 'HTML'
        })
      });
    } catch (tgErr) {
      console.warn('[Telegram Error] Gagal kirim ke Telegram:', tgErr);
    }

    // ── 3. Kirim ke WhatsApp Grup SikanBot VPS (jika toggle aktif) ──
    const isWaActive = sendToWaCheckbox ? sendToWaCheckbox.checked : true;
    if (isWaActive) {
      const selectedVal = waGroupSelect ? waGroupSelect.value : '120363412565156974@g.us';
      const botUrl = `${getSikanBotBaseUrl()}/api/send-group`;

      let targetGroups = [];
      if (selectedVal === '__ALL_ACADEMIC__') {
        targetGroups = [
          { id: '120363314636289389@g.us', name: 'TeeRJeTe 3A' },
          { id: '120363412565156974@g.us', name: 'Fyi Task Kuliah' }
        ];
      } else if (selectedVal === '__custom__') {
        const customId = manualGroupId ? manualGroupId.value.trim() : '';
        if (customId) {
          targetGroups = [{ id: customId, name: 'Grup Kustom' }];
        }
      } else if (selectedVal) {
        const selText = waGroupSelect.options[waGroupSelect.selectedIndex]?.textContent || 'Grup Pilihan';
        targetGroups = [{ id: selectedVal, name: selText.split('(')[0].trim() }];
      }

      if (targetGroups.length > 0) {
        const successSent = [];
        const failedSent  = [];

        for (const tg of targetGroups) {
          try {
            const waRes = await fetchWithTimeout(botUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                groupId: tg.id,
                message: waCaption
              })
            }, 10000);

            const waJson = await waRes.json();
            if (waJson.status) {
              successSent.push(tg.name);
              console.log(`[WhatsApp] Sukses terkirim ke: ${tg.name} (${tg.id})`);
            } else {
              failedSent.push(`${tg.name} (${waJson.error || 'Gagal'})`);
            }
          } catch (waPostErr) {
            console.warn(`[WhatsApp Error] Gagal kirim ke ${tg.name}:`, waPostErr);
            failedSent.push(`${tg.name} (Koneksi timeout)`);
          }
        }

        if (successSent.length > 0) {
          waStatusReport = ` serta diteruskan ke WhatsApp Grup (<b>${successSent.join(', ')}</b>)`;
        }
        if (failedSent.length > 0) {
          console.warn('[WhatsApp] Beberapa grup gagal dikirim:', failedSent);
        }
      }
    }

    // ── Sukses Tampilan ──
    loadingOverlay.classList.remove('active');
    if (popupSuccessDesc) {
      if (isWaActive && waStatusReport) {
        popupSuccessDesc.innerHTML = `Data tugas berhasil tersimpan di Google Sheets, dikirim ke Telegram,${waStatusReport}.`;
      } else {
        popupSuccessDesc.innerHTML = `Data tugas berhasil tersimpan di Google Sheets &amp; dikirim ke Telegram.`;
      }
    }
    popupSuccess.classList.add('open');
    form.reset();

    // Auto-tutup popup setelah 5 detik
    setTimeout(() => {
      popupSuccess.classList.remove('open');
    }, 5000);

  } catch (err) {
    loadingOverlay.classList.remove('active');
    alert('❌ Gagal mengirim data! Periksa koneksi internet Anda.');
    console.error('[Submit Error]', err);
  }
});

// ================================================================
//  §6  POPUP — Tutup manual
// ================================================================
closePopup.addEventListener('click', () => {
  popupSuccess.classList.remove('open');
});

popupSuccess.addEventListener('click', (e) => {
  if (e.target === popupSuccess) {
    popupSuccess.classList.remove('open');
  }
});
