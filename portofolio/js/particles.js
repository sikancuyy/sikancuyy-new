// Simple Particle System for Canvas Background
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const particles = [];
    const maxParticles = window.innerWidth < 768 ? 50 : 100;

    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.size = Math.random() * 2 + 1;
            this.speedX = Math.random() * 1 - 0.5;
            this.speedY = Math.random() * 1 - 0.5;
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;

            // Bounce off edges
            if (this.x > width || this.x < 0) this.speedX *= -1;
            if (this.y > height || this.y < 0) this.speedY *= -1;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            // Particle color, changes slightly on dark mode handled by opacity
            ctx.fillStyle = document.body.classList.contains('dark-mode') ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 123, 255, 0.3)';
            ctx.fill();
        }
    }

    function init() {
        for (let i = 0; i < maxParticles; i++) {
            particles.push(new Particle());
        }
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);
        
        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();
            
            // Connect lines
            for (let j = i; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 100) {
                    ctx.beginPath();
                    const opacity = document.body.classList.contains('dark-mode') ? (1 - distance/100) * 0.2 : (1 - distance/100) * 0.1;
                    ctx.strokeStyle = document.body.classList.contains('dark-mode') ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 123, 255, ${opacity})`;
                    ctx.lineWidth = 1;
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }
        requestAnimationFrame(animate);
    }

    init();
    animate();

    // Resize handler
    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        particles.length = 0;
        init();
    });
});
