// Starfield Animation
const canvas = document.getElementById('starCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Star array
let stars = [];

// Create stars
function createStars(count = 200) {
    stars = [];
    for (let i = 0; i < count; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 1.5,
            opacity: Math.random() * 0.5 + 0.5,
            twinkleSpeed: Math.random() * 0.02 + 0.005
        });
    }
}

// Draw stars
function drawStars() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    stars.forEach(star => {
        // Twinkling effect
        star.opacity += star.twinkleSpeed;
        if (star.opacity > 1 || star.opacity < 0.3) {
            star.twinkleSpeed *= -1;
        }

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(100, 200, 255, ${star.opacity})`;
        ctx.fill();

        // Add glow effect
        ctx.strokeStyle = `rgba(100, 200, 255, ${star.opacity * 0.3})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
    });
}

// Animation loop
function animate() {
    drawStars();
    requestAnimationFrame(animate);
}

// Initialize
createStars(200);
animate();

// Handle window resize
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    createStars(200);
});

// Add click animation on profile card
document.querySelector('.profile-card').addEventListener('click', function() {
    this.style.transform = 'scale(0.98)';
    setTimeout(() => {
        this.style.transform = 'scale(1)';
    }, 100);
});
