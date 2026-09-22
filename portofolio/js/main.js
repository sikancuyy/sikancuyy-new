// Main Script

window.addEventListener('load', () => {
    const loader = document.getElementById('loader');
    loader.style.opacity = '0';
    setTimeout(() => {
        loader.style.display = 'none';
    }, 500); // 0.5s for CSS fade-out transition
});

document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Toggle
    const hamburger = document.querySelector('.hamburger');
    const navContainer = document.getElementById('mobile-nav-container');
    const navOverlay = document.getElementById('nav-overlay');
    const closeMenuBtn = document.getElementById('close-menu');
    const links = document.querySelectorAll('.nav-links a');
    
    function toggleMenu() {
        if (navContainer) {
            navContainer.classList.toggle('active');
            if (navOverlay) navOverlay.classList.toggle('active');
        } else {
            // Fallback for old structure if somehow used
            const navLinks = document.querySelector('.nav-links');
            if(navLinks) navLinks.classList.toggle('active');
        }
    }

    if(hamburger) {
        hamburger.addEventListener('click', toggleMenu);
    }
    
    if(closeMenuBtn) {
        closeMenuBtn.addEventListener('click', toggleMenu);
    }
    
    if(navOverlay) {
        navOverlay.addEventListener('click', toggleMenu);
    }

    // Close menu when link clicked
    links.forEach(link => {
        link.addEventListener('click', () => {
            if(navContainer && navContainer.classList.contains('active')) {
                toggleMenu();
            } else {
                const navLinks = document.querySelector('.nav-links');
                if(navLinks && navLinks.classList.contains('active')) {
                     navLinks.classList.remove('active');
                }
            }
        });
    });

    // Active Link Highlight on Scroll
    const sections = document.querySelectorAll('section');
    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (pageYOffset >= (sectionTop - 200)) {
                current = section.getAttribute('id');
            }
        });

        links.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').includes(current)) {
                link.classList.add('active');
            }
        });

        // Header scroll effect
        const header = document.querySelector('.header');
        if (window.scrollY > 50) {
            header.style.padding = '5px 5%';
            header.style.background = 'rgba(255,255,255,0.1)';
        } else {
            header.style.padding = '15px 5%';
            header.style.background = 'transparent';
        }

        // Scroll to Top Button
        const scrollTopBtn = document.getElementById('scroll-top');
        if (window.scrollY > 500) {
            scrollTopBtn.classList.add('show');
        } else {
            scrollTopBtn.classList.remove('show');
        }
    });

    // Scroll to Top action
    const scrollTopBtn = document.getElementById('scroll-top');
    if(scrollTopBtn) {
        scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }


});


// Image Modal Logic
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('image-modal');
    const modalImg = document.getElementById('modal-img');
    const closeModal = document.querySelector('.close-modal');
    const allImages = document.querySelectorAll('img:not(#modal-img)');

    if (modal && modalImg) {
        allImages.forEach(img => {
            img.style.cursor = 'pointer';
            img.addEventListener('click', function() {
                modal.style.display = 'flex';
                modalImg.src = this.src;
            });
        });

        if (closeModal) {
            closeModal.addEventListener('click', function() {
                modal.style.display = 'none';
            });
        }

        modal.addEventListener('click', function(e) {
            if (e.target === modal || e.target.classList.contains('modal-wrapper')) {
                modal.style.display = 'none';
            }
        });
    }
});
