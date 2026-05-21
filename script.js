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
    gather: 180,
    bundle: 60,
    explode: 140,
    reset: 30
};

let particles = [];

function createParticles() {
    particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push(spawnParticle(i));
    }
}

function edgePosition(index, total) {
    // Distribute evenly around the full perimeter
    const perimeter = 2 * (canvas.width + canvas.height);
    const step = perimeter / total;
    const pos = (index * step) + (Math.random() * step * 0.8);
    const w = canvas.width;
    const h = canvas.height;
    const pad = 60;

    let x, y;
    if (pos < w) {
        // Top edge
        x = pos;
        y = -pad;
    } else if (pos < w + h) {
        // Right edge
        x = w + pad;
        y = pos - w;
    } else if (pos < 2 * w + h) {
        // Bottom edge
        x = w - (pos - w - h);
        y = h + pad;
    } else {
        // Left edge
        x = -pad;
        y = h - (pos - 2 * w - h);
    }
    return { x, y };
}

function spawnParticle(index) {
    const { x, y } = edgePosition(index ?? Math.floor(Math.random() * PARTICLE_COUNT), PARTICLE_COUNT);
    const angle = Math.atan2(CENTER_Y() - y, CENTER_X() - x);
    return {
        x, y,
        vx: 0, vy: 0,
        radius: Math.random() * 1.8 + 0.5,
        opacity: Math.random() * 0.5 + 0.5,
        color: randomColor(),
        angle,
        dist: Math.hypot(CENTER_X() - x, CENTER_Y() - y),
        explodeVx: 0,
        explodeVy: 0,
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

function resetParticle(p, index) {
    const { x, y } = edgePosition(index ?? Math.floor(Math.random() * PARTICLE_COUNT), PARTICLE_COUNT);
    p.x = x; p.y = y;
    p.vx = 0; p.vy = 0;
    p.radius = Math.random() * 1.8 + 0.5;
    p.opacity = Math.random() * 0.5 + 0.5;
    p.color = randomColor();
    p.angle = Math.atan2(CENTER_Y() - p.y, CENTER_X() - p.x);
    p.dist = Math.hypot(CENTER_X() - p.x, CENTER_Y() - p.y);
    p.explodeVx = 0;
    p.explodeVy = 0;
}

function update() {
    phaseTimer++;
    const cx = CENTER_X(), cy = CENTER_Y();
    const progress = phaseTimer / PHASE_DURATIONS[phase];

    if (phase === 'gather') {
        blackHoleRadius = Math.min(blackHoleRadius + 0.6, 55);
        blackHoleOpacity = Math.min(blackHoleOpacity + 0.02, 1);

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

            if (phaseTimer === PHASE_DURATIONS.bundle - 1) {
                const explodeAngle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 18 + 6;
                p.explodeVx = Math.cos(explodeAngle) * speed;
                p.explodeVy = Math.sin(explodeAngle) * speed;
            }
        });

    } else if (phase === 'explode') {
        blackHoleRadius = Math.max(blackHoleRadius - 1.2, 0);
        blackHoleOpacity = Math.max(blackHoleOpacity - 0.025, 0);

        particles.forEach(p => {
            p.vx = p.explodeVx * (1 - progress * 0.6);
            p.vy = p.explodeVy * (1 - progress * 0.6);
            p.x += p.vx;
            p.y += p.vy;
            p.opacity = Math.max(0, 1 - progress * 1.2);
            p.radius = Math.max(0.3, p.radius - 0.04);
        });

    } else if (phase === 'reset') {
        blackHoleRadius = 0;
        blackHoleOpacity = 0;
        if (phaseTimer === 1) {
            particles.forEach((p, i) => resetParticle(p, i));
        }
    }

    if (phaseTimer >= PHASE_DURATIONS[phase]) {
        phaseTimer = 0;
        if (phase === 'gather')       phase = 'bundle';
        else if (phase === 'bundle')  phase = 'explode';
        else if (phase === 'explode') phase = 'reset';
        else if (phase === 'reset')   phase = 'gather';
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
