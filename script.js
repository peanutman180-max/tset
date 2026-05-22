const canvas = document.getElementById('starCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const PARTICLE_COUNT = 180;
const CENTER_X = () => canvas.width / 2;
const CENTER_Y = () => canvas.height / 2;

let phase = 'gather';
let phaseTimer = 0;
let blackHoleRadius = 0;
let blackHoleOpacity = 0;

const PHASE_DURATIONS = {
    gather: 320,
    bundle: 60,
    explode: 160,
    rest: 80
};

let particles = [];

function createParticles() {
    particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push(spawnParticle());
    }
}

function spawnParticle() {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    return {
        x, y,
        vx: 0, vy: 0,
        radius: Math.random() * 1.8 + 0.5,
        opacity: Math.random() * 0.5 + 0.4,
        color: randomColor(),
        explodeVx: 0,
        explodeVy: 0,
        targetX: Math.random() * canvas.width,
        targetY: Math.random() * canvas.height,
    };
}

function randomColor() {
    const colors = [
        '100, 200, 255',
        '167, 139, 250',
        '244, 114, 182',
        '255, 255, 255',
        '96, 240, 190',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

function resetParticleToScreen(p) {
    // Give each particle a new random target spot on screen to drift to
    p.targetX = Math.random() * canvas.width;
    p.targetY = Math.random() * canvas.height;
    p.vx = 0; p.vy = 0;
    p.radius = Math.random() * 1.8 + 0.5;
    p.opacity = Math.random() * 0.5 + 0.4;
    p.color = randomColor();
    p.explodeVx = 0;
    p.explodeVy = 0;
}

function update() {
    phaseTimer++;
    const cx = CENTER_X(), cy = CENTER_Y();
    const progress = phaseTimer / PHASE_DURATIONS[phase];

    if (phase === 'gather') {
        // Black hole grows as particles get sucked in
        blackHoleRadius = Math.min(blackHoleRadius + 0.4, 55);
        blackHoleOpacity = Math.min(blackHoleOpacity + 0.015, 1);

        particles.forEach(p => {
            const dx = cx - p.x;
            const dy = cy - p.y;
            const ease = 0.018 + progress * 0.03;
            p.vx += dx * ease;
            p.vy += dy * ease;
            p.vx *= 0.85;
            p.vy *= 0.85;
            p.x += p.vx;
            p.y += p.vy;
            p.opacity = Math.min(1, p.opacity + 0.005);
        });

    } else if (phase === 'bundle') {
        blackHoleRadius = Math.min(blackHoleRadius + 0.3, 70);
        blackHoleOpacity = 1;

        particles.forEach(p => {
            const dx = cx - p.x;
            const dy = cy - p.y;
            p.vx += dx * 0.15;
            p.vy += dy * 0.15;
            p.vx *= 0.7;
            p.vy *= 0.7;
            p.x += p.vx + (Math.random() - 0.5) * 0.5;
            p.y += p.vy + (Math.random() - 0.5) * 0.5;
            p.opacity = Math.min(1, p.opacity + 0.03);
            p.radius = Math.min(p.radius + 0.03, 3.5);

            // Pre-calculate explode targets — fly to random screen positions
            if (phaseTimer === PHASE_DURATIONS.bundle - 1) {
                p.targetX = Math.random() * canvas.width;
                p.targetY = Math.random() * canvas.height;
                const angle = Math.atan2(p.targetY - cy, p.targetX - cx);
                const speed = Math.random() * 16 + 8;
                p.explodeVx = Math.cos(angle) * speed;
                p.explodeVy = Math.sin(angle) * speed;
            }
        });

    } else if (phase === 'explode') {
        // Black hole shrinks as particles fly out
        blackHoleRadius = Math.max(blackHoleRadius - 1.0, 0);
        blackHoleOpacity = Math.max(blackHoleOpacity - 0.02, 0);

        particles.forEach(p => {
            // Decelerate as they approach their target
            const dx = p.targetX - p.x;
            const dy = p.targetY - p.y;
            const dist = Math.hypot(dx, dy);

            if (dist > 5) {
                p.vx += dx * 0.015;
                p.vy += dy * 0.015;
                p.vx *= 0.88;
                p.vy *= 0.88;
                p.x += p.vx;
                p.y += p.vy;
            } else {
                // Arrived — settle in place
                p.x = p.targetX;
                p.y = p.targetY;
                p.vx = 0; p.vy = 0;
            }

            // Fade back in instead of fading out
            p.opacity = Math.min(0.9, p.opacity + 0.02);
            p.radius = Math.max(0.5, p.radius - 0.02);
        });

    } else if (phase === 'rest') {
        // Particles just sit on screen, gently twinkling
        blackHoleRadius = 0;
        blackHoleOpacity = 0;

        particles.forEach(p => {
            // Subtle random drift while resting
            p.x += (Math.random() - 0.5) * 0.3;
            p.y += (Math.random() - 0.5) * 0.3;
            p.opacity += (Math.random() - 0.5) * 0.02;
            p.opacity = Math.min(0.95, Math.max(0.2, p.opacity));
        });

        // On last rest frame reset targets for next gather
        if (phaseTimer === PHASE_DURATIONS.rest - 1) {
            particles.forEach(p => resetParticleToScreen(p));
        }
    }

    if (phaseTimer >= PHASE_DURATIONS[phase]) {
        phaseTimer = 0;
        if (phase === 'gather')      phase = 'bundle';
        else if (phase === 'bundle') phase = 'explode';
        else if (phase === 'explode') phase = 'rest';
        else if (phase === 'rest')   phase = 'gather';
    }
}

function drawBlackHole(cx, cy) {
    if (blackHoleRadius <= 0 || blackHoleOpacity <= 0) return;

    const outerGlow = ctx.createRadialGradient(cx, cy, blackHoleRadius * 0.8, cx, cy, blackHoleRadius * 3.5);
    outerGlow.addColorStop(0, `rgba(80, 40, 160, ${0.18 * blackHoleOpacity})`);
    outerGlow.addColorStop(0.4, `rgba(40, 80, 180, ${0.10 * blackHoleOpacity})`);
    outerGlow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath();
    ctx.arc(cx, cy, blackHoleRadius * 3.5, 0, Math.PI * 2);
    ctx.fillStyle = outerGlow;
    ctx.fill();

    const ringGrad = ctx.createRadialGradient(cx, cy, blackHoleRadius * 0.75, cx, cy, blackHoleRadius * 1.6);
    ringGrad.addColorStop(0,    `rgba(200, 120, 255, ${0.55 * blackHoleOpacity})`);
    ringGrad.addColorStop(0.35, `rgba(100, 180, 255, ${0.35 * blackHoleOpacity})`);
    ringGrad.addColorStop(0.7,  `rgba(60,  60,  120, ${0.12 * blackHoleOpacity})`);
    ringGrad.addColorStop(1,    'rgba(0,0,0,0)');
    ctx.beginPath();
    ctx.arc(cx, cy, blackHoleRadius * 1.6, 0, Math.PI * 2);
    ctx.fillStyle = ringGrad;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, blackHoleRadius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0, 0, 0, ${blackHoleOpacity})`;
    ctx.fill();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(2, 4, 8, 1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${p.opacity})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${p.opacity * 0.15})`;
        ctx.fill();
    });

    drawBlackHole(CENTER_X(), CENTER_Y());

    if (phase === 'bundle' && phaseTimer > PHASE_DURATIONS.bundle * 0.7) {
        const flashProgress = (phaseTimer - PHASE_DURATIONS.bundle * 0.7) / (PHASE_DURATIONS.bundle * 0.3);
        const gradient = ctx.createRadialGradient(CENTER_X(), CENTER_Y(), 0, CENTER_X(), CENTER_Y(), 80 * flashProgress);
        gradient.addColorStop(0, `rgba(200, 230, 255, ${0.7 * flashProgress})`);
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
    blackHoleRadius = 0;
    blackHoleOpacity = 0;
});

const card = document.querySelector('.card');
if (card) {
    card.addEventListener('click', function () {
        this.style.transform = 'translate(-50%, -50%) scale(0.98)';
        setTimeout(() => {
            this.style.transform = 'translate(-50%, -50%) scale(1)';
        }, 100);
    });
}

// SPARKLE TRAIL
document.addEventListener('mousemove', (e) => {
  const sparkle = document.createElement('div');
  sparkle.style.cssText = `
    position: fixed;
    left: ${e.clientX}px;
    top: ${e.clientY}px;
    width: 8px;
    height: 8px;
    pointer-events: none;
    z-index: 99999;
    transform: translate(-50%, -50%) rotate(${Math.random() * 360}deg);
    animation: sparkle-fade 0.6s ease forwards;
    font-size: ${10 + Math.random() * 10}px;
    line-height: 1;
  `;
  sparkle.textContent = ['✦', '✧', '⋆', '★', '🟍'][Math.floor(Math.random() * 5)];
  document.body.appendChild(sparkle);
  setTimeout(() => sparkle.remove(), 600);
});
