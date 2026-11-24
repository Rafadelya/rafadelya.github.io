/**
 * GrainyImage Web Component
 * A custom HTML element for applying various grainy/noisy effects to images
 *
 * Source: https://github.com/yashrajbharti/Grainy-image
 * Copyright (c) 2025 Grainy Image Web Component
 * License: MIT — see ./LICENSE in this folder
 *
 * Methods:
 * - canvas: Pixel-level noise using Canvas API
 * - css-mask: Repeating radial gradient mask
 * - css-background: Layered backgrounds with noise.svg
 * - svg-turbulence: SVG feTurbulence filter
 */

class GrainyImage extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._animationFrame = null;
    this._animationTime = 0;
  }

  static get observedAttributes() {
    return [
      "src",
      "method",
      "intensity",
      "animated",
      "width",
      "height",
      "noise-url",
      "animation-duration",
      "octaves",
      "alt",
    ];
  }

  connectedCallback() {
    this.render();
  }

  disconnectedCallback() {
    if (this._animationFrame) {
      cancelAnimationFrame(this._animationFrame);
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.render();
    }
  }

  get src() {
    return this.getAttribute("src") || "";
  }

  get method() {
    return this.getAttribute("method") || "canvas";
  }

  get intensity() {
    return parseFloat(this.getAttribute("intensity")) || 0.3;
  }

  get animated() {
    return this.getAttribute("animated") === "true";
  }

  get width() {
    return parseInt(this.getAttribute("width")) || 400;
  }

  get height() {
    return parseInt(this.getAttribute("height")) || 300;
  }

  get noiseUrl() {
    return this.getAttribute("noise-url") || "assets/noise.svg";
  }

  get animationDuration() {
    return parseFloat(this.getAttribute("animation-duration")) || 3;
  }

  get octaves() {
    return parseInt(this.getAttribute("octaves")) || 3;
  }

  get alt() {
    return this.getAttribute("alt") || "";
  }

  render() {
    const method = this.method;

    // Cancel any existing animation
    if (this._animationFrame) {
      cancelAnimationFrame(this._animationFrame);
      this._animationFrame = null;
    }

    // Clear shadow root
    this.shadowRoot.innerHTML = "";

    // Create base styles
    const style = document.createElement("style");
    style.textContent = `
            :host {
                display: inline-block;
                position: relative;
                overflow: hidden;
            }
            .container {
                width: 100%;
                height: 100%;
                position: relative;
            }
        `;
    this.shadowRoot.appendChild(style);

    // Route to appropriate method
    switch (method) {
      case "canvas":
        this.renderCanvas();
        break;
      case "css-mask":
        this.renderCSSMask();
        break;
      case "css-background":
        this.renderCSSBackground();
        break;
      case "svg-turbulence":
        this.renderSVGTurbulence();
        break;
      default:
        this.renderCanvas();
    }
  }

  /**
   * Method 1: Canvas-based noise
   * Generates noise at the pixel level using Canvas API
   */
  renderCanvas() {
    const container = document.createElement("div");
    container.className = "container";

    const canvas = document.createElement("canvas");
    canvas.width = this.width;
    canvas.height = this.height;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    if (this.alt) {
      canvas.setAttribute("role", "img");
      canvas.setAttribute("aria-label", this.alt);
    }

    container.appendChild(canvas);
    this.shadowRoot.appendChild(container);

    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const animate = () => {
        // Draw the image
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Add noise
        const intensity = this.intensity * 255;
        for (let i = 0; i < data.length; i += 4) {
          const noise = (Math.random() - 0.5) * intensity;
          data[i] += noise; // R
          data[i + 1] += noise; // G
          data[i + 2] += noise; // B
        }

        ctx.putImageData(imageData, 0, 0);

        if (this.animated) {
          this._animationFrame = requestAnimationFrame(animate);
        }
      };

      animate();
    };

    img.src = this.src;
  }

  /**
   * Method 2: CSS Gradient Mask
   * Uses sub-pixel repeating radial gradients (inspired by Adam Argyle)
   */
  renderCSSMask() {
    const style = document.createElement("style");

    const propertyName =
      "--grain-lines-" + Math.random().toString(36).slice(2, 11);
    const animName = "grain-anim-" + Math.random().toString(36).slice(2, 11);

    // Calculate a subtle variation (much smaller than before to avoid blinking)
    const minValue = this.intensity;
    const maxValue = this.intensity * 1.05; // Only 5% variation instead of 20%

    style.textContent = `
            @property ${propertyName} {
                syntax: "<length>";
                inherits: false;
                initial-value: ${minValue}px;
            }
            
            @keyframes ${animName} {
                0%, 100% {
                    ${propertyName}: ${minValue}px;
                }
                50% {
                    ${propertyName}: ${maxValue}px;
                }
            }
            
            .grain-container {
                width: ${this.width}px;
                height: ${this.height}px;
                position: relative;
                display: block;
            }
            
            .grain-image {
                width: 100%;
                height: 100%;
                object-fit: cover;
                display: block;
                animation: ${animName} ${this.animationDuration}s ease-in-out infinite;
                mask: repeating-radial-gradient(
                    circle at center,
                    #000,
                    var(${propertyName}),
                    #000,
                    0,
                    #0000,
                    calc(var(${propertyName}) * 2),
                    #0000 0
                );
            }
        `;

    this.shadowRoot.appendChild(style);

    const container = document.createElement("div");
    container.className = "grain-container";

    const img = document.createElement("img");
    img.className = "grain-image";
    img.src = this.src;
    if (this.alt) {
      img.alt = this.alt;
    }

    container.appendChild(img);
    this.shadowRoot.appendChild(container);
  }

  /**
   * Method 3: CSS Background Layers
   * Layers the image and noise.svg using CSS backgrounds
   */
  renderCSSBackground() {
    const style = document.createElement("style");
    style.textContent = `
            .background-container {
                width: 100%;
                height: 100%;
                position: relative;
                background:
                    url(${this.noiseUrl}),
                    url(${this.src});
                background-size: cover, cover;
                background-position: center, center;
                background-repeat: no-repeat, no-repeat;
                background-blend-mode: overlay;
                opacity: ${1 - this.intensity * 0.2};
            }
            
            ${
              this.animated
                ? `
                @keyframes noise-shift {
                    0%, 100% { background-position: 0% 0%, center; }
                    25% { background-position: 5% 5%, center; }
                    50% { background-position: -5% 5%, center; }
                    75% { background-position: 5% -5%, center; }
                }
                
                .background-container {
                    animation: noise-shift 2s ease-in-out infinite;
                }
            `
                : ""
            }
        `;

    this.shadowRoot.appendChild(style);

    const container = document.createElement("div");
    container.className = "background-container";
    container.style.width = this.width + "px";
    container.style.height = this.height + "px";
    if (this.alt) {
      container.setAttribute("role", "img");
      container.setAttribute("aria-label", this.alt);
    }

    this.shadowRoot.appendChild(container);
  }

  /**
   * Method 4: SVG feTurbulence filter
   * Uses SVG filters for fractal noise
   */
  renderSVGTurbulence() {
    const style = document.createElement("style");
    style.textContent = `
            .svg-container {
                width: ${this.width}px;
                height: ${this.height}px;
                display: block;
            }
            
            .svg-container svg {
                width: 100%;
                height: 100%;
                display: block;
            }
        `;
    this.shadowRoot.appendChild(style);

    const container = document.createElement("div");
    container.className = "svg-container";

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.setAttribute("viewBox", `0 0 ${this.width} ${this.height}`);

    // Create filter
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    const filter = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "filter"
    );
    filter.setAttribute(
      "id",
      "noise-filter-" + Math.random().toString(36).slice(2, 11)
    );
    filter.setAttribute("x", "0");
    filter.setAttribute("y", "0");
    filter.setAttribute("width", "100%");
    filter.setAttribute("height", "100%");

    // Turbulence - higher frequency for grain instead of smudge
    const turbulence = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "feTurbulence"
    );
    turbulence.setAttribute("type", "fractalNoise");
    // Use high frequency (0.8-1.5) for fine grain instead of low frequency smudge
    turbulence.setAttribute("baseFrequency", "0.9");
    // Lower octaves for simpler grain pattern
    turbulence.setAttribute("numOctaves", "1");
    turbulence.setAttribute("result", "turbulence");
    turbulence.setAttribute("seed", "0");

    // Color matrix to desaturate and control intensity
    const colorMatrix = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "feColorMatrix"
    );
    colorMatrix.setAttribute("in", "turbulence");
    colorMatrix.setAttribute("type", "saturate");
    colorMatrix.setAttribute("values", "0");
    colorMatrix.setAttribute("result", "desaturated");

    // Component transfer to control grain intensity
    const componentTransfer = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "feComponentTransfer"
    );
    componentTransfer.setAttribute("in", "desaturated");
    componentTransfer.setAttribute("result", "grainIntensity");

    // Adjust alpha to control visibility based on intensity attribute
    const funcA = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "feFuncA"
    );
    funcA.setAttribute("type", "linear");
    funcA.setAttribute("slope", this.intensity.toString());
    componentTransfer.appendChild(funcA);

    // Blend with source using soft-light for subtle grain
    const blend = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "feBlend"
    );
    blend.setAttribute("in", "SourceGraphic");
    blend.setAttribute("in2", "grainIntensity");
    blend.setAttribute("mode", "soft-light");

    filter.appendChild(turbulence);
    filter.appendChild(colorMatrix);
    filter.appendChild(componentTransfer);
    filter.appendChild(blend);
    defs.appendChild(filter);
    svg.appendChild(defs);

    // Add title for accessibility
    if (this.alt) {
      const title = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "title"
      );
      title.textContent = this.alt;
      svg.appendChild(title);
    }

    // Image element
    const image = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "image"
    );
    image.setAttribute("href", this.src);
    image.setAttribute("width", this.width.toString());
    image.setAttribute("height", this.height.toString());
    image.setAttribute("filter", `url(#${filter.getAttribute("id")})`);

    svg.appendChild(image);
    container.appendChild(svg);
    this.shadowRoot.appendChild(container);
  }
}

// Register the custom element
customElements.define("grainy-image", GrainyImage);
