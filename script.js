document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    const floatingDarkModeToggle = document.getElementById('darkModeToggle');

    // --- Dark Mode Toggle Fungsionalitas ---

    // Fungsi untuk memperbarui ikon tombol dark mode mengambang
    const syncFloatingDarkModeToggleIcon = () => {
        if (floatingDarkModeToggle) {
            if (body.classList.contains('dark-mode')) {
                floatingDarkModeToggle.innerHTML = '☀️'; // Sun emoji
            } else {
                floatingDarkModeToggle.innerHTML = '🌙'; // Moon emoji
            }
        }
    };

    // Inisialisasi status tema saat dimuat
    const initializeTheme = () => {
        const currentTheme = localStorage.getItem('theme');
        if (currentTheme) {
            body.className = currentTheme; // Terapkan tema yang tersimpan
        } else {
            // Deteksi preferensi sistem jika tidak ada tema tersimpan
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                body.classList.add('dark-mode');
                localStorage.setItem('theme', 'dark-mode');
            } else {
                body.classList.add('light-mode');
                localStorage.setItem('theme', 'light-mode');
            }
        }
        syncFloatingDarkModeToggleIcon(); // Pastikan ikon tombol mengambang sesuai tema
    };

    // Panggil inisialisasi tema saat DOM siap
    initializeTheme();

    // Event listener untuk tombol dark mode mengambang
    if (floatingDarkModeToggle) {
        floatingDarkModeToggle.addEventListener('click', () => {
            if (body.classList.contains('light-mode')) {
                body.classList.remove('light-mode');
                body.classList.add('dark-mode');
                localStorage.setItem('theme', 'dark-mode');
            } else {
                body.classList.remove('dark-mode');
                body.classList.add('light-mode');
                localStorage.setItem('theme', 'light-mode');
            }
            syncFloatingDarkModeToggleIcon(); // Sinkronkan ikon setelah perubahan tema
        });
    }

    // Karena ini adalah halaman menu sederhana, sebagian besar fungsionalitas
    // JavaScript dari contoh sebelumnya (seperti navbar scroll, smooth scroll,
    // intersection observer untuk animasi, dan modal galeri) tidak relevan
    // untuk halaman ini. Jadi, saya menghapusnya untuk menjaga kesederhanaan.
});