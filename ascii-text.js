// ascii-text.js
class ASCIIText {
  constructor(container, options = {}) {
    this.container = container;
    this.text = options.text || "Hello World";
    this.asciiFontSize = options.asciiFontSize || 8;
    this.textFontSize = options.textFontSize || 200;
    this.textColor = options.textColor || "#fdf9f3";
    this.planeBaseHeight = options.planeBaseHeight || 8;
    this.enableWaves = options.enableWaves !== false;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.mesh = null;
    this.texture = null;
    this.textCanvas = null;
    this.filter = null;
    this.animationFrame = null;
    this.mouse = { x: 0, y: 0 };
  }

  async init() {
    this.createTextCanvas();
    this.createScene();
    this.createAsciiFilter();
    this.setSize(this.container.clientWidth, this.container.clientHeight);
    
    this.container.appendChild(this.filter.domElement);
    
    this.container.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.container.addEventListener('touchmove', this.handleMouseMove.bind(this));
    
    await this.loadFonts();
    this.animate();
  }

  createTextCanvas() {
    this.textCanvas = document.createElement('canvas');
    const ctx = this.textCanvas.getContext('2d');
    ctx.font = `600 ${this.textFontSize}px 'IBM Plex Mono'`;
    
    const metrics = ctx.measureText(this.text);
    const width = Math.ceil(metrics.width) + 40;
    const height = this.textFontSize * 1.4;
    
    this.textCanvas.width = width;
    this.textCanvas.height = height;
    
    ctx.fillStyle = this.textColor;
    ctx.font = `600 ${this.textFontSize}px 'IBM Plex Mono'`;
    ctx.fillText(this.text, 20, this.textFontSize * 0.9);
  }

  createScene() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, 1, 1, 1000);
    this.camera.position.z = 30;

    this.renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    this.renderer.setPixelRatio(1);

    const aspect = this.textCanvas.width / this.textCanvas.height;
    const planeW = this.planeBaseHeight * aspect;
    const planeH = this.planeBaseHeight;

    const geometry = new THREE.PlaneGeometry(planeW, planeH, 36, 36);
    this.texture = new THREE.CanvasTexture(this.textCanvas);
    this.texture.minFilter = THREE.NearestFilter;

    const material = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec2 vUv;
        uniform float uTime;
        uniform float uEnableWaves;
        void main() {
          vUv = uv;
          float time = uTime * 5.;
          vec3 pos = position;
          pos.x += sin(time + position.y) * 0.5 * uEnableWaves;
          pos.y += cos(time + position.z) * 0.15 * uEnableWaves;
          pos.z += sin(time + position.x) * uEnableWaves;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uTime;
        uniform sampler2D uTexture;
        void main() {
          float time = uTime;
          vec2 pos = vUv;
          float move = sin(time) * 0.01;
          float r = texture2D(uTexture, pos + cos(time*2. - time + pos.x)*.01).r;
          float g = texture2D(uTexture, pos + tan(time*.5 + pos.x - time)*.01).g;
          float b = texture2D(uTexture, pos - cos(time*2. + time + pos.y)*.01).b;
          float a = texture2D(uTexture, pos).a;
          gl_FragColor = vec4(r, g, b, a);
        }
      `,
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        uTexture: { value: this.texture },
        uEnableWaves: { value: this.enableWaves ? 1.0 : 0.0 }
      }
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.mesh);
  }

  createAsciiFilter() {
    this.filter = new AsciiFilter(this.renderer, {
      fontSize: this.asciiFontSize,
      fontFamily: "'IBM Plex Mono', monospace"
    });
  }

  setSize(w, h) {
    if (!w || !h) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.filter.setSize(w, h);
  }

  handleMouseMove(e) {
    const rect = this.container.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    this.mouse = { x, y };
  }

  animate() {
    this.animationFrame = requestAnimationFrame(() => this.animate());

    const time = Date.now() * 0.001;
    
    // Update texture
    this.texture.needsUpdate = true;
    
    // Update shader time
    this.mesh.material.uniforms.uTime.value = Math.sin(time);

    // Gentle rotation based on mouse
    const targetX = (this.mouse.y / this.filter.height - 0.5) * -1;
    const targetY = (this.mouse.x / this.filter.width - 0.5);
    
    this.mesh.rotation.x += (targetX - this.mesh.rotation.x) * 0.05;
    this.mesh.rotation.y += (targetY - this.mesh.rotation.y) * 0.05;

    this.filter.render(this.scene, this.camera);
  }

  destroy() {
    cancelAnimationFrame(this.animationFrame);
    if (this.filter) this.filter.dispose();
    this.container.innerHTML = '';
  }
}

// Helper class for ASCII overlay
class AsciiFilter {
  constructor(renderer, { fontSize = 12, fontFamily = 'monospace' }) {
    this.renderer = renderer;
    this.domElement = document.createElement('div');
    this.domElement.style.position = 'absolute';
    this.domElement.style.top = '0';
    this.domElement.style.left = '0';
    this.domElement.style.width = '100%';
    this.domElement.style.height = '100%';
    this.domElement.style.overflow = 'hidden';

    this.pre = document.createElement('pre');
    this.pre.style.margin = '0';
    this.pre.style.padding = '0';
    this.pre.style.lineHeight = '1em';
    this.pre.style.fontFamily = fontFamily;
    this.pre.style.fontSize = fontSize + 'px';
    this.pre.style.position = 'absolute';
    this.pre.style.mixBlendMode = 'difference';
    this.pre.style.background = 'radial-gradient(circle, #ff6188 0%, #fc9867 50%, #ffd866 100%)';
    this.pre.style.webkitBackgroundClip = 'text';
    this.pre.style.webkitTextFillColor = 'transparent';
    this.pre.style.zIndex = '9';

    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;

    this.domElement.appendChild(this.canvas);
    this.domElement.appendChild(this.pre);

    this.charset = ' .\'`^",:;Il!i~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$';
  }

  setSize(w, h) {
    this.width = w;
    this.height = h;
    this.renderer.setSize(w, h);
    this.canvas.width = Math.floor(w / 8);
    this.canvas.height = Math.floor(h / 8);
  }

  render(scene, camera) {
    this.renderer.render(scene, camera);
    this.ctx.drawImage(this.renderer.domElement, 0, 0, this.canvas.width, this.canvas.height);
    this.asciify();
  }

  asciify() {
    const imgData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height).data;
    let output = '';
    for (let y = 0; y < this.canvas.height; y++) {
      for (let x = 0; x < this.canvas.width; x++) {
        const i = (x + y * this.canvas.width) * 4;
        const gray = (imgData[i] * 0.3 + imgData[i+1] * 0.6 + imgData[i+2] * 0.1) / 255;
        const charIndex = Math.floor((1 - gray) * (this.charset.length - 1));
        output += this.charset[charIndex] || ' ';
      }
      output += '\n';
    }
    this.pre.textContent = output;
  }

  dispose() {
    if (this.domElement.parentNode) this.domElement.parentNode.removeChild(this.domElement);
  }
}

// Export for easy use
window.ASCIIText = ASCIIText;
