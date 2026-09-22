// Typing Effect
document.addEventListener('DOMContentLoaded', () => {
    const typedTextSpan = document.getElementById("typed-output");
    
    if(!typedTextSpan) return;

    const textArray = ["Network Engineering.", "Cloud Enthusiast.", "IoT Developer.", "Mahasiswa Sarjana Terapan."];
    const typingDelay = 100;
    const erasingDelay = 50;
    const newTextDelay = 2000; // Delay between current and next text
    let textArrayIndex = 0;
    let charIndex = 0;

    function type() {
        if (charIndex < textArray[textArrayIndex].length) {
            typedTextSpan.textContent += textArray[textArrayIndex].charAt(charIndex);
            charIndex++;
            setTimeout(type, typingDelay);
        } else {
            setTimeout(erase, newTextDelay);
        }
    }

    function erase() {
        if (charIndex > 0) {
            typedTextSpan.textContent = textArray[textArrayIndex].substring(0, charIndex - 1);
            charIndex--;
            setTimeout(erase, erasingDelay);
        } else {
            textArrayIndex++;
            if (textArrayIndex >= textArray.length) textArrayIndex = 0;
            setTimeout(type, typingDelay + 1100);
        }
    }

    // Initiate typing effect
    setTimeout(type, newTextDelay + 250);
});
