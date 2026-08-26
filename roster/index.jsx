// ============================================================
//  TRJT 3A — Portal Akademik & Roster (React Edition)
//  Features: Dark/Light mode, Realtime clock, Live indicator,
//            Search/Filter highlight, CSV exports, modern dock nav
// ============================================================

import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// ─────────────────────────────────────────
//  DATA REPOSITORY (ROSTER REV-2)
// ─────────────────────────────────────────
const DATA = {
  jadwal: {
    senin: [
      { mk: "Prakt. Antena dan Propagasi", dosen: "Ipan Suandi, S.T., M.T.", ruang: "L10 – Lab. HF & Propagasi", gedung: "L10", jam: "07:30", sel: "10:00" },
      { mk: "Jaringan Komputer Lanjut", dosen: "Muhammad Syahroni, S.T., M.T.", ruang: "R16 – Gedung III T. Elektro Lt. 2", gedung: "R16", jam: "10:20", sel: "12:00" },
    ],
    selasa: [
      { mk: "Praktikum Jaringan Komputer Lanjut", dosen: "Muhammad Syahroni, S.T., M.T.", ruang: "L13 – Lab. Jar. Komputer", gedung: "L13", jam: "07:30", sel: "10:00" },
      { mk: "Prakt. Sistem Komunikasi Satelit dan Radar", dosen: "Rachmawati, S.T., M.Eng.", ruang: "L10 – Lab. HF & Propagasi", gedung: "L10", jam: "10:20", sel: "12:50" },
      { mk: "Teknik Instalasi Fiber Optik", dosen: "Anita Fauziah, SST., M.T.", ruang: "R15 – Gedung III T. Elektro Lt. 2", gedung: "R15", jam: "13:30", sel: "15:10" },
    ],
    rabu: [
      { mk: "Prakt. Teknik Instalasi Fiber Optik", dosen: "Anita Fauziah, SST., M.T.", ruang: "L23 – Lab. Transmisi", gedung: "L23", jam: "07:30", sel: "10:00" },
      { mk: "Antena dan Propagasi", dosen: "Ipan Suandi, S.T., M.T.", ruang: "R17 – Gedung III T. Elektro Lt. 2", gedung: "R17", jam: "10:20", sel: "12:50" },
    ],
    kamis: [
      { mk: "Prakt. Sistem Komunikasi Seluler", dosen: "Yassir, S.T., M.Eng.Sc.", ruang: "L11 – Lab. Jaringan Telekomunikasi", gedung: "L11", jam: "07:30", sel: "10:00" },
      { mk: "Sistem Komunikasi Satelit dan Radar", dosen: "Rachmawati, S.T., M.Eng.", ruang: "R17 – Gedung III T. Elektro Lt. 2", gedung: "R17", jam: "10:20", sel: "12:50" },
    ],
    jumat: [
      { mk: "Sistem Komunikasi Seluler", dosen: "Yassir, S.T., M.Eng.Sc.", ruang: "R18 – Gedung III T. Elektro Lt. 2", gedung: "R18", jam: "07:30", sel: "10:00" },
      { mk: "Metodologi Penelitian", dosen: "Dr. Nelly Safitri, SST., M.Eng.Sc.", ruang: "R18 – Gedung III T. Elektro Lt. 2", gedung: "R18", jam: "10:20", sel: "12:00" },
    ],
  },
  kelompok: {
    "Komunikasi Data": {
      dosen: "Fakhrur Razi, S.ST., M.T.",
      groups: [
        { name: "Kelompok 1", members: [{ id: "2024203020032", name: "Lunna Auamara" }, { id: "2024203020016", name: "Renka Laura" }, { id: "2024203020025", name: "Farhan Alfarsiyi" }, { id: "2024203020029", name: "Muhammad Rais" }] },
        { name: "Kelompok 2", members: [{ id: "2024203020019", name: "Khairul Fajar Sidiq" }, { id: "2024203020011", name: "Durratul Hikmah" }, { id: "2024203020020", name: "Nesya Zikriya" }, { id: "2024203020006", name: "Suheil Maulana" }] },
        { name: "Kelompok 3", members: [{ id: "2024203020003", name: "Sarah Fonna" }, { id: "2024203020028", name: "Aqil Ocean Difra" }, { id: "2024203020031", name: "Syawal Fitriyadi" }, { id: "2024203020009", name: "Firlita Afianti" }] },
        { name: "Kelompok 4", members: [{ id: "2024203020008", name: "Rahmat Haikal" }, { id: "2024203020001", name: "Ilal Ilhamdi" }, { id: "2024203020022", name: "Muhammad Halfi Al Barizi" }, { id: "2024203020036", name: "Nazar Al Farabi" }, { id: "2024203020013", name: "Afriansyah Sinamo" }] },
      ],
    },
    "Saluran Transmisi": {
      dosen: "Ipan Suandi, S.T., M.T.",
      groups: [
        { name: "Kelompok I", members: [{ id: "2024203020013", name: "Afriansyah Sinamo" }, { id: "2024203020019", name: "Khairul Fajar Sidiq" }, { id: "2024203020008", name: "Rahmat Haikal" }] },
        { name: "Kelompok II", members: [{ id: "2024203020011", name: "Durratul Hikmah" }, { id: "2024203020003", name: "Sarah Fonna" }, { id: "2024203020001", name: "Ilal Ilhamdi" }] },
        { name: "Kelompok III", members: [{ id: "2024203020016", name: "Renka Laura" }, { id: "2024203020006", name: "Suheil Maulana" }, { id: "2024203020009", name: "Firlita Afianti" }] },
        { name: "Kelompok IV", members: [{ id: "2024203020022", name: "Muhammad Halfi Al Barizi" }, { id: "2024203020031", name: "Syawal Fitriyadi" }] },
        { name: "Kelompok V", members: [{ id: "2024203020025", name: "Farhan Alfarsiyi" }, { id: "2024203020020", name: "Nesya Zikriya" }, { id: "2024203020029", name: "Muhammad Rais" }] },
        { name: "Kelompok VI", members: [{ id: "2024203020032", name: "Lunna Auamara" }, { id: "2024203020028", name: "Aqil Ocean Difra" }, { id: "2024203020036", name: "Nazar Al Farabi" }] },
      ],
    },
    "Teknik Gelombang Mikro": {
      dosen: "Munawar, S.T., M.T.",
      groups: [
        { name: "Kelompok I", members: [{ id: "2024203020019", name: "Khairul Fajar Sidiq" }, { id: "2024203020003", name: "Sarah Fonna" }, { id: "2024203020006", name: "Suheil Maulana" }, { id: "2024203020025", name: "Farhan Alfarsiyi" }] },
        { name: "Kelompok II", members: [{ id: "2024203020028", name: "Aqil Ocean Difra" }, { id: "2024203020001", name: "Ilal Ilhamdi" }, { id: "2024203020029", name: "Muhammad Rais" }, { id: "2024203020011", name: "Durratul Hikmah" }] },
        { name: "Kelompok III", members: [{ id: "2024203020013", name: "Afriansyah Sinamo" }, { id: "2024203020032", name: "Lunna Auamara" }, { id: "2024203020031", name: "Syawal Fitriyadi" }, { id: "2024203020022", name: "Muhammad Halfi Al Barizi" }] },
        { name: "Kelompok IV", members: [{ id: "2024203020036", name: "Nazar Al Farabi" }, { id: "2024203020009", name: "Firlita Afianti" }, { id: "2024203020008", name: "Rahmat Haikal" }] },
        { name: "Kelompok V", members: [{ id: "2024203020020", name: "Nesya Zikriya" }, { id: "2024203020016", name: "Renka Laura" }] },
      ],
    },
  },
  piket: [
    { name: "Kelompok 1", members: [{ id: "2024203020028", name: "Aqil Ocean Difra" }, { id: "2024203020016", name: "Renka Laura" }, { id: "2024203020009", name: "Firlita Afianti" }, { id: "2024203020013", name: "Afriansyah Sinamo" }] },
    { name: "Kelompok 2", members: [{ id: "2024203020032", name: "Lunna Auamara" }, { id: "2024203020036", name: "Nazar Al Farabi" }, { id: "2024203020008", name: "Rahmat Haikal" }, { id: "2024203020022", name: "Muhammad Halfi Al Barizi" }] },
    { name: "Kelompok 3", members: [{ id: "2024203020031", name: "Syawal Fitriyadi" }, { id: "2024203020003", name: "Sarah Fonna" }, { id: "2024203020029", name: "Muhammad Rais" }] },
    { name: "Kelompok 4", members: [{ id: "2024203020020", name: "Nesya Zikriya" }, { id: "2024203020025", name: "Farhan Alfarsiyi" }, { id: "2024203020001", name: "Ilal Ilhamdi" }] },
    { name: "Kelompok 5", members: [{ id: "2024203020011", name: "Durratul Hikmah" }, { id: "2024203020006", name: "Suheil Maulana" }, { id: "2024203020019", name: "Khairul Fajar Sidiq" }] },
  ],
  mahasiswa: [
    { no: 1, id: "2024203020013", name: "Afriansyah Sinamo" },
    { no: 2, id: "2024203020028", name: "Aqil Ocean Difra" },
    { no: 3, id: "2024203020011", name: "Durratul Hikmah" },
    { no: 4, id: "2024203020025", name: "Farhan Alfarsiyi" },
    { no: 5, id: "2024203020009", name: "Firlita Afianti" },
    { no: 6, id: "2024203020001", name: "Ilal Ilhamdi" },
    { no: 7, id: "2024203020019", name: "Khairul Fajar Sidiq" },
    { no: 8, id: "2024203020032", name: "Lunna Auamara" },
    { no: 9, id: "2024203020022", name: "Muhammad Halfi Al Barizi" },
    { no: 10, id: "2024203020029", name: "Muhammad Rais" },
    { no: 11, id: "2024203020036", name: "Nazar Al Farabi" },
    { no: 12, id: "2024203020020", name: "Nesya Zikriya" },
    { no: 13, id: "2024203020008", name: "Rahmat Haikal" },
    { no: 14, id: "2024203020016", name: "Renka Laura" },
    { no: 15, id: "2024203020003", name: "Sarah Fonna" },
    { no: 16, id: "2024203020006", name: "Suheil Maulana" },
    { no: 17, id: "2024203020031", name: "Syawal Fitriyadi" },
  ],
  dosen: [
    { no: 1, nip: "198005102005011002", nama: "Ipan Suandi, S.T., M.T.", mks: ["Prakt. Antena dan Propagasi", "Antena dan Propagasi"] },
    { no: 2, nip: "197210262006041001", nama: "Muhammad Syahroni, S.T., M.T.", mks: ["Jaringan Komputer Lanjut", "Praktikum Jaringan Komputer Lanjut"] },
    { no: 3, nip: "197908262003122001", nama: "Rachmawati, S.T., M.Eng.", mks: ["Prakt. Sistem Komunikasi Satelit dan Radar", "Sistem Komunikasi Satelit dan Radar"] },
    { no: 4, nip: "197201291998032001", nama: "Anita Fauziah, SST., M.T.", mks: ["Teknik Instalasi Fiber Optik", "Prakt. Teknik Instalasi Fiber Optik"] },
    { no: 5, nip: "198004192003121002", nama: "Yassir, S.T., M.Eng.Sc.", mks: ["Prakt. Sistem Komunikasi Seluler", "Sistem Komunikasi Seluler"] },
    { no: 6, nip: "-", nama: "Dr. Nelly Safitri, SST., M.Eng.Sc.", mks: ["Metodologi Penelitian"] },
  ],
};

const DAYS_KEY  = ["senin","selasa","rabu","kamis","jumat"];
const DAYS_FULL = ["Senin","Selasa","Rabu","Kamis","Jumat"];
const DAYS_SHORT= ["Sen","Sel","Rab","Kam","Jum"];
const JS_TO_IDX = { 1:0, 2:1, 3:2, 4:3, 5:4 };

// ─────────────────────────────────────────
//  UTILITIES
// ─────────────────────────────────────────
const titleCase = (s) => {
  if (!s) return "";
  return s.replace(/\w\S*/g, (t) => t[0].toUpperCase() + t.slice(1).toLowerCase());
};

const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

const isLive = (jam, sel) => {
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  return cur >= toMinutes(jam) && cur <= toMinutes(sel);
};

const minutesUntil = (hhmm) => {
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  return toMinutes(hhmm) - cur;
};

const todayIdx = () => JS_TO_IDX[new Date().getDay()] ?? -1;

function downloadCSV(filename, rows) {
  const bom = "\uFEFF";
  const csv = bom + rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ─────────────────────────────────────────
//  CUSTOM HOOKS
// ─────────────────────────────────────────
function useClock() {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  useEffect(() => {
    document.body.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);
  const toggle = useCallback(() => setTheme((t) => (t === "dark" ? "light" : "dark")), []);
  return [theme, toggle];
}

// ─────────────────────────────────────────
//  ICONS
// ─────────────────────────────────────────
const Icon = ({ path, size = 18, label }) => (
  <svg
    width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round"
    aria-hidden={!label} aria-label={label}
    role={label ? "img" : undefined}
  >
    {path}
  </svg>
);

const Icons = {
  calendar:  <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
  users:     <><circle cx="9" cy="7" r="4"/><path d="M2 21c0-4 3.1-7 7-7h2"/><circle cx="17" cy="9" r="3"/><path d="M14 21c0-3 2.1-5.5 5-5.5"/></>,
  shield:    <><path d="M3 6l9-4 9 4v6c0 4.5-4 8-9 9-5-1-9-4.5-9-9V6z"/><polyline points="9 12 11 14 15 10"/></>,
  file:      <><path d="M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z"/><polyline points="14 3 14 8 19 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></>,
  userTie:   <><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/><line x1="19" y1="8" x2="23" y2="8"/><line x1="21" y1="6" x2="21" y2="10"/></>,
  sun:       <><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></>,
  moon:      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>,
  download:  <><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
  search:    <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
  x:         <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
  clock:     <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
  mapPin:    <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></>,
  building:  <><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="9" y1="22" x2="9" y2="22.01"/><line x1="15" y1="22" x2="15" y2="22.01"/><line x1="9" y1="18" x2="9" y2="18.01"/><line x1="15" y1="18" x2="15" y2="18.01"/><line x1="9" y1="14" x2="9" y2="14.01"/><line x1="15" y1="14" x2="15" y2="14.01"/><line x1="9" y1="10" x2="9" y2="10.01"/><line x1="15" y1="10" x2="15" y2="10.01"/><line x1="9" y1="6" x2="9" y2="6.01"/><line x1="15" y1="6" x2="15" y2="6.01"/></>,
};

// ─────────────────────────────────────────
//  SUB-COMPONENTS
// ─────────────────────────────────────────
function HighlightText({ text, query }) {
  if (!query) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="highlight-match">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

function Toast({ message, onDone }) {
  useEffect(() => {
    const id = setTimeout(onDone, 2400);
    return () => clearTimeout(id);
  }, [onDone]);
  return <div className="toast" role="status" aria-live="polite">{message}</div>;
}

// ─────────────────────────────────────────
//  TAB: JADWAL KULIAH
// ─────────────────────────────────────────
function TabJadwal() {
  const [activeDay, setActiveDay] = useState(() => {
    const t = todayIdx();
    return t >= 0 ? t : 0;
  });
  const todayI = todayIdx();
  const classes = DATA.jadwal[DAYS_KEY[activeDay]] || [];

  const getUpcoming = (item) => {
    if (activeDay !== todayI) return null;
    const diff = minutesUntil(item.jam);
    if (diff > 0 && diff <= 30) return diff;
    return null;
  };

  return (
    <div className="tab on">
      <div className="days" role="tablist" aria-label="Pilih hari">
        {DAYS_KEY.map((_, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={i === activeDay}
            className={`d${i === todayI ? " today" : ""}${i === activeDay ? " sel" : ""}`}
            onClick={() => setActiveDay(i)}
          >
            {DAYS_SHORT[i]}
          </button>
        ))}
      </div>

      <div className="day-label">
        <span>{DAYS_FULL[activeDay]}</span>
        <span style={{ fontSize: 12, color: "var(--text-sub)", fontWeight: 600 }}>{classes.length} Mata Kuliah</span>
      </div>

      <div className="rows" role="tabpanel">
        {classes.length === 0 ? (
          <div className="empty-row">
            <Icon path={Icons.calendar} size={28} />
            <span style={{ marginTop: 8, display: "block" }}>Tidak ada jadwal perkuliahan hari ini.</span>
          </div>
        ) : (
          classes.map((item, i) => {
            const live = activeDay === todayI && isLive(item.jam, item.sel);
            const upcoming = getUpcoming(item);
            return (
              <article key={i} className={`row${live ? " live" : ""}`}>
                <div className="row-time">
                  <span className="r-time-start">{item.jam}</span>
                  <span className="r-time-end">{item.sel}</span>
                </div>
                <div className="row-body">
                  <div className="r-mk">
                    {titleCase(item.mk)}
                    {live && (
                      <span className="live-pill" aria-label="Sedang berlangsung">
                        <span className="live-dot" />
                        Live
                      </span>
                    )}
                    {upcoming && !live && (
                      <span className="upcoming-pill">
                        <Icon path={Icons.clock} size={10} />
                        {upcoming}m lagi
                      </span>
                    )}
                  </div>
                  <div className="r-dosen">
                    <Icon path={Icons.userTie} size={12} />
                    {item.dosen}
                  </div>
                  <div className="r-room-row">
                    <span className="r-room-badge">
                      <Icon path={Icons.mapPin} size={11} />
                      {item.ruang}
                    </span>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
//  TAB: KELOMPOK PRAKTIKUM
// ─────────────────────────────────────────
function TabKelompok({ onToast }) {
  const mkList = Object.keys(DATA.kelompok);
  const [activeMK, setActiveMK] = useState(mkList[0]);
  const [search, setSearch] = useState("");
  const searchRef = useRef(null);

  const mkData = DATA.kelompok[activeMK];

  const filteredGroups = useMemo(() => {
    if (!search.trim()) return mkData.groups;
    const q = search.toLowerCase();
    return mkData.groups
      .map((g) => ({
        ...g,
        members: g.members.filter(
          (m) => m.name.toLowerCase().includes(q) || m.id.includes(q)
        ),
      }))
      .filter((g) => g.members.length > 0);
  }, [search, mkData]);

  const handleExportCSV = () => {
    const rows = [["Mata Kuliah", "Dosen", "Kelompok", "No", "NIM", "Nama Mahasiswa"]];
    Object.entries(DATA.kelompok).forEach(([mk, val]) => {
      val.groups.forEach((g) => {
        g.members.forEach((m, i) => rows.push([mk, val.dosen, g.name, i + 1, m.id, titleCase(m.name)]));
      });
    });
    downloadCSV("Kelompok_Praktikum_TRJT3A.csv", rows);
    onToast("CSV kelompok berhasil diunduh ✓");
  };

  return (
    <div className="tab on">
      <div className="export-bar">
        <div className="export-bar-left">
          <h2>Kelompok Praktikum</h2>
          <span className="export-sub">Pembagian grup tugas & praktikum lab</span>
        </div>
        <div className="export-bar-right">
          <button className="btn-export csv" onClick={handleExportCSV}>
            <Icon path={Icons.download} size={13} /> CSV
          </button>
        </div>
      </div>

      <div className="search-wrap">
        <Icon path={Icons.search} size={14} />
        <input
          ref={searchRef}
          type="text"
          placeholder="Cari nama atau kelompok..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="mktabs" role="tablist">
        {mkList.map((mk) => (
          <button
            key={mk}
            className={`mkt${mk === activeMK ? " sel" : ""}`}
            onClick={() => { setActiveMK(mk); setSearch(""); }}
          >
            {mk}
          </button>
        ))}
      </div>

      <div className="mk-note">
        <Icon path={Icons.userTie} size={13} />
        <span>Dosen Pengampu: <b>{mkData.dosen}</b></span>
      </div>

      <div className="gg">
        {filteredGroups.length === 0 ? (
          <div className="empty-row">Tidak ada hasil untuk &quot;{search}&quot;</div>
        ) : (
          filteredGroups.map((g, gi) => (
            <div key={gi} className="gc">
              <div className="gc-head">
                <b><Icon path={Icons.users} size={14} /> {g.name}</b>
                <em>{g.members.length} Anggota</em>
              </div>
              <div className="gc-body">
                {g.members.map((m, mi) => (
                  <div key={mi} className="ml">
                    <span className="ml-n">{mi + 1}</span>
                    <div>
                      <div className="ml-nm"><HighlightText text={titleCase(m.name)} query={search} /></div>
                      <div className="ml-id"><HighlightText text={m.id} query={search} /></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
//  TAB: PIKET
// ─────────────────────────────────────────
function TabPiket({ onToast }) {
  const [search, setSearch] = useState("");

  const filteredGroups = useMemo(() => {
    if (!search.trim()) return DATA.piket;
    const q = search.toLowerCase();
    return DATA.piket
      .map((g) => ({ ...g, members: g.members.filter((m) => m.name.toLowerCase().includes(q) || m.id.includes(q)) }))
      .filter((g) => g.members.length > 0);
  }, [search]);

  const handleExportCSV = () => {
    const rows = [["Regu Piket", "No", "NIM", "Nama Mahasiswa"]];
    DATA.piket.forEach((p) => p.members.forEach((m, i) => rows.push([p.name, i + 1, m.id, titleCase(m.name)])));
    downloadCSV("Kelompok_Piket_TRJT3A.csv", rows);
    onToast("CSV piket berhasil diunduh ✓");
  };

  return (
    <div className="tab on">
      <div className="export-bar">
        <div className="export-bar-left">
          <h2>Kelompok Piket</h2>
          <span className="export-sub">4 regu piket kebersihan & kerapian kelas</span>
        </div>
        <div className="export-bar-right">
          <button className="btn-export csv" onClick={handleExportCSV}>
            <Icon path={Icons.download} size={13} /> CSV
          </button>
        </div>
      </div>

      <div className="search-wrap">
        <Icon path={Icons.search} size={14} />
        <input
          type="text"
          placeholder="Cari nama anggota piket..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="gg">
        {filteredGroups.length === 0 ? (
          <div className="empty-row">Tidak ada hasil untuk &quot;{search}&quot;</div>
        ) : (
          filteredGroups.map((g, gi) => (
            <div key={gi} className="gc">
              <div className="gc-head">
                <b><Icon path={Icons.shield} size={14} /> {g.name}</b>
                <em>{g.members.length} Petugas</em>
              </div>
              <div className="gc-body">
                {g.members.map((m, mi) => (
                  <div key={mi} className="ml">
                    <span className="ml-n">{mi + 1}</span>
                    <div>
                      <div className="ml-nm"><HighlightText text={titleCase(m.name)} query={search} /></div>
                      <div className="ml-id"><HighlightText text={m.id} query={search} /></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
//  TAB: DAFTAR MAHASISWA
// ─────────────────────────────────────────
function TabDaftar({ onToast }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return DATA.mahasiswa;
    const q = search.toLowerCase();
    return DATA.mahasiswa.filter((m) => m.name.toLowerCase().includes(q) || m.id.includes(q));
  }, [search]);

  const handleExportCSV = () => {
    const rows = [["No", "NIM", "Nama Mahasiswa"], ...DATA.mahasiswa.map((m) => [m.no, m.id, titleCase(m.name)])];
    downloadCSV("Daftar_Mahasiswa_TRJT3A.csv", rows);
    onToast("CSV mahasiswa berhasil diunduh ✓");
  };

  return (
    <div className="tab on">
      <div className="export-bar">
        <div className="export-bar-left">
          <h2>Daftar Mahasiswa</h2>
          <span className="export-sub">17 Mahasiswa Aktif Kelas TRJT 3A</span>
        </div>
        <div className="export-bar-right">
          <button className="btn-export csv" onClick={handleExportCSV}>
            <Icon path={Icons.download} size={13} /> CSV
          </button>
        </div>
      </div>

      <div className="search-wrap">
        <Icon path={Icons.search} size={14} />
        <input
          type="text"
          placeholder="Cari berdasarkan nama atau NIM..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th className="td-n">No</th>
              <th>NIM</th>
              <th>Nama Lengkap</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={3} className="empty-row">Tidak ada mahasiswa yang cocok.</td>
              </tr>
            ) : (
              filtered.map((m) => (
                <tr key={m.id}>
                  <td className="td-n">{m.no}</td>
                  <td className="td-id"><HighlightText text={m.id} query={search} /></td>
                  <td><HighlightText text={titleCase(m.name)} query={search} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
//  TAB: DAFTAR DOSEN
// ─────────────────────────────────────────
function TabDosen() {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return DATA.dosen;
    const q = search.toLowerCase();
    return DATA.dosen.filter(
      (d) => d.nama.toLowerCase().includes(q) || d.nip.includes(q) || d.mks.some((mk) => mk.toLowerCase().includes(q))
    );
  }, [search]);

  return (
    <div className="tab on">
      <div className="export-bar">
        <div className="export-bar-left">
          <h2>Dosen Pengampu</h2>
          <span className="export-sub">Daftar dosen pengajar semester ganjil</span>
        </div>
      </div>

      <div className="search-wrap">
        <Icon path={Icons.search} size={14} />
        <input
          type="text"
          placeholder="Cari dosen atau mata kuliah..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="dosen-grid">
        {filtered.length === 0 ? (
          <div className="empty-row">Dosen tidak ditemukan.</div>
        ) : (
          filtered.map((d, idx) => {
            const words = d.nama.split(" ");
            const initial = (words[0][0] + (words[1]?.[0] || "")).toUpperCase();
            return (
              <div key={idx} className="dosen-card">
                <div className="dc-avatar">{initial}</div>
                <div className="dc-body">
                  <div className="dc-name"><HighlightText text={d.nama} query={search} /></div>
                  <div className="dc-nip">
                    <Icon path={Icons.file} size={11} />
                    {d.nip !== "-" ? <HighlightText text={d.nip} query={search} /> : <span style={{ opacity: 0.6 }}>NIP Belum Tercatat</span>}
                  </div>
                  <div className="dc-mks">
                    {d.mks.map((mk, mi) => (
                      <span key={mi} className="dc-mk-badge">
                        <HighlightText text={mk} query={search} />
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
//  MAIN APP
// ─────────────────────────────────────────
const TABS = [
  { id: "jadwal",   label: "Jadwal",   title: "Jadwal Kuliah",     icon: Icons.calendar },
  { id: "kelompok", label: "Kelompok", title: "Kelompok Praktikum",icon: Icons.users },
  { id: "piket",    label: "Piket",    title: "Kelompok Piket",    icon: Icons.shield },
  { id: "daftar",   label: "Mahasiswa",title: "Daftar Mahasiswa",  icon: Icons.file },
  { id: "dosen",    label: "Dosen",    title: "Daftar Dosen",      icon: Icons.userTie },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("jadwal");
  const [theme, toggleTheme]      = useTheme();
  const [toast, setToast]         = useState(null);
  const now = useClock();

  const clockStr = (() => {
    const p = (n) => String(n).padStart(2, "0");
    return `${p(now.getHours())}:${p(now.getMinutes())}:${p(now.getSeconds())}`;
  })();

  const activeTabData = TABS.find((t) => t.id === activeTab);

  return (
    <div className="container">
      {/* HEADER */}
      <header className="app-bar" role="banner">
        <div className="app-bar-left">
          <div className="app-bar-title">
            {activeTabData?.title.split(" ")[0]} <span>{activeTabData?.title.split(" ").slice(1).join(" ")}</span>
          </div>
          <div className="app-bar-sub">TRJT 3A · Semester Ganjil 2026/2027</div>
        </div>
        <div className="app-bar-right">
          <div className="app-clock" aria-label={`Jam sekarang ${clockStr}`}>
            {clockStr}
          </div>
        </div>
      </header>

      {/* MAIN VIEW */}
      <main className="wrap">
        {activeTab === "jadwal" && <TabJadwal />}
        {activeTab === "kelompok" && <TabKelompok onToast={setToast} />}
        {activeTab === "piket" && <TabPiket onToast={setToast} />}
        {activeTab === "daftar" && <TabDaftar onToast={setToast} />}
        {activeTab === "dosen" && <TabDosen />}
      </main>

      {/* FLOATING ACTION BUTTONS */}
      <div className="fab-group">
        <button className="dark-toggle" onClick={toggleTheme} title="Ganti Tema">
          <Icon path={theme === "dark" ? Icons.sun : Icons.moon} size={16} />
        </button>
      </div>

      {/* BOTTOM DOCK NAVIGATION */}
      <nav aria-label="Navigasi utama">
        <div className="nw">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`nb${activeTab === t.id ? " on" : ""}`}
              onClick={() => { setActiveTab(t.id); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              aria-label={t.title}
            >
              <Icon path={t.icon} size={19} />
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* TOAST ALERT */}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}