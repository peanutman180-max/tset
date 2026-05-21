// ── Starfield Canvas ──
const canvas = document.getElementById('starCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const PARTICLE_COUNT = 180;
const CENTER_X = () => canvas.width / 2;
const CENTER_Y = () => canvas.height / 2;

// Phases: 'gather' → 'bundle' → 'explode' → 'reset'
let phase = 'gather';
let phaseTimer = 0;

const PHASE_DURATIONS = {
    gather: 120,   // frames to drift inward
    bundle: 40,    // frames to hold tight
    explode: 80,   // frames to fly outward
    reset: 30      // frames to fade/reset
};

let particles = [];

function createParticles() {
    particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push(spawnParticle());
    }
}

function spawnParticle() {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * Math.max(canvas.width, canvas.height) * 0.6 + 100;
    return {
        x: CENTER_X() + Math.cos(angle) * dist,
        y: CENTER_Y() + Math.sin(angle) * dist,
        vx: 0,
        vy: 0,
        radius: Math.random() * 1.8 + 0.5,
        opacity: Math.random() * 0.5 + 0.5,
        color: randomColor(),
        angle: angle,
        dist: dist,
        explodeVx: 0,
        explodeVy: 0,
    };
}

function randomColor() {
    const colors = [
        '100, 200, 255',   // cyan-blue
        '167, 139, 250',   // purple
        '244, 114, 182',   // pink
        '255, 255, 255',   // white
        '96, 240, 190',    // teal
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

function resetParticle(p) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * Math.max(canvas.width, canvas.height) * 0.6 + 100;
    p.x = CENTER_X() + Math.cos(angle) * dist;
    p.y = CENTER_Y() + Math.sin(angle) * dist;
    p.vx = 0; p.vy = 0;
    p.radius = Math.random() * 1.8 + 0.5;
    p.opacity = Math.random() * 0.5 + 0.5;
    p.color = randomColor();
    p.angle = angle;
    p.dist = dist;
    p.explodeVx = 0;
    p.explodeVy = 0;
}

function update() {
    phaseTimer++;
    const cx = CENTER_X(), cy = CENTER_Y();
    const progress = phaseTimer / PHASE_DURATIONS[phase];

    if (phase === 'gather') {
        // Pull particles toward center with easing
        particles.forEach(p => {
            const dx = cx - p.x;
            const dy = cy - p.y;
            const ease = 0.025 + progress * 0.04;
            p.vx += dx * ease;
            p.vy += dy * ease;
            p.vx *= 0.85;
            p.vy *= 0.85;
            p.x += p.vx;
            p.y += p.vy;
            p.opacity = Math.min(1, p.opacity + 0.01);
        });

    } else if (phase === 'bundle') {
        // Clump tightly at center with slight jitter
        particles.forEach(p => {
            const dx = cx - p.x;
            const dy = cy - p.y;
            p.vx += dx * 0.15;
            p.vy += dy * 0.15;
            p.vx *= 0.7;
            p.vy *= 0.7;
            p.x += p.vx + (Math.random() - 0.5) * 0.5;
            p.y += p.vy + (Math.random() - 0.5) * 0.5;
            // Charge up — brighten
            p.opacity = Math.min(1, p.opacity + 0.03);
            p.radius = Math.min(p.radius + 0.03, 3.5);

            // Pre-calculate explode direction on last bundle frame
            if (phaseTimer === PHASE_DURATIONS.bundle - 1) {
                const explodeAngle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 18 + 6;
                p.explodeVx = Math.cos(explodeAngle) * speed;
                p.explodeVy = Math.sin(explodeAngle) * speed;
            }
        });

    } else if (phase === 'explode') {
        // Fly outward, fade out
        particles.forEach(p => {
            p.vx = p.explodeVx * (1 - progress * 0.6);
            p.vy = p.explodeVy * (1 - progress * 0.6);
            p.x += p.vx;
            p.y += p.vy;
            p.opacity = Math.max(0, 1 - progress * 1.2);
            p.radius = Math.max(0.3, p.radius - 0.04);
        });

    } else if (phase === 'reset') {
        // Quietly reposition particles off-screen
        if (phaseTimer === 1) {
            particles.forEach(p => resetParticle(p));
        }
    }

    // Advance phase
    if (phaseTimer >= PHASE_DURATIONS[phase]) {
        phaseTimer = 0;
        if (phase === 'gather')  phase = 'bundle';
        else if (phase === 'bundle')  phase = 'explode';
        else if (phase === 'explode') phase = 'reset';
        else if (phase === 'reset')   phase = 'gather';
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dark background
    ctx.fillStyle = 'rgba(2, 4, 8, 1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw particles
    particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${p.opacity})`;
        ctx.fill();

        // Glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${p.opacity * 0.15})`;
        ctx.fill();
    });

    // Flash at center during bundle → explode transition
    if (phase === 'bundle' && phaseTimer > PHASE_DURATIONS.bundle * 0.7) {
        const flashProgress = (phaseTimer - PHASE_DURATIONS.bundle * 0.7) / (PHASE_DURATIONS.bundle * 0.3);
        const gradient = ctx.createRadialGradient(CENTER_X(), CENTER_Y(), 0, CENTER_X(), CENTER_Y(), 60 * flashProgress);
        gradient.addColorStop(0, `rgba(200, 230, 255, ${0.6 * flashProgress})`);
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

function animate() {
    update();
    draw();
    requestAnimationFrame(animate);
}

createParticles();
animate();

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    createParticles();
    phase = 'gather';
    phaseTimer = 0;
});

// Card click animation
const card = document.querySelector('.card');
if (card) {
    card.addEventListener('click', function () {
        this.style.transform = 'translate(-50%, -50%) scale(0.98)';
        setTimeout(() => {
            this.style.transform = 'translate(-50%, -50%) scale(1)';
        }, 100);
    });
}
