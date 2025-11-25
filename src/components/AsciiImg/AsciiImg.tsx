"use client";

import React, { useEffect, useRef } from "react";
import {
  CanvasTexture,
  Color,
  LinearFilter,
  LinearMipMapLinearFilter,
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  RGBAFormat,
  Scene,
  ShaderMaterial,
  Texture,
  TextureLoader,
  Vector2,
  WebGLRenderer,
} from "three";
import { cn } from "@/lib/utils";

/**
 * Props for the AsciiImg component.
 */
interface AsciiImgProps {
  /** Source URL of the image */
  src: string;
  /**
   * String of characters sorted by brightness (dark to light).
   * Default: " .:-=+*#%@"
   */
  chars?: string;
  /**
   * Font size in pixels. Determines the resolution of the ASCII grid.
   * Lower values = higher resolution (more CPU/GPU load).
   * Default: 10
   */
  fontSize?: number;
  /**
   * CSS class for the container.
   * Ensure the container has width and height defined.
   */
  className?: string;
  /**
   * Color of the ASCII characters.
   * Pass 'original' to use the image's pixel colors.
   * Default: '#ffffff'
   */
  color?: string | "original";
  /**
   * Background color of the scene.
   * Default: '#000000'
   */
  backgroundColor?: string;
  /**
   * Invert the brightness mapping.
   * Default: false
   */
  invert?: boolean;
}

const DEFAULT_CHARS = " .:-=+*#%@";

// --- Shaders ---

const vertexShader = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
uniform sampler2D uTexture;
uniform sampler2D uCharTexture;
uniform vec2 uResolution;
uniform vec2 uTextureResolution;
uniform vec2 uGridSize;
uniform float uCharCount;
uniform vec3 uColor;
uniform bool uUseOriginalColor;
uniform bool uInvert;
uniform vec3 uBackgroundColor;

varying vec2 vUv;

// Function to fit image cover style
vec2 getCoverUv(vec2 uv, vec2 resolution, vec2 texResolution) {
    float rs = resolution.x / resolution.y;
    float rt = texResolution.x / texResolution.y;

    vec2 newUv = uv;

    if (rs > rt) {
        newUv.y = (uv.y - 0.5) * (resolution.y * rt / resolution.x) + 0.5;
    } else {
        newUv.x = (uv.x - 0.5) * (resolution.x / rt / resolution.y) + 0.5;
    }

    return newUv;
}

void main() {
    // 1. Quantize UV to grid
    vec2 cellCount = uGridSize;
    vec2 gridUv = floor(vUv * cellCount) / cellCount;

    // 2. Calculate center of the cell for sampling image
    vec2 pixelSize = 1.0 / cellCount;
    vec2 centerUv = gridUv + pixelSize * 0.5;

    // 3. Adjust for object-cover aspect ratio
    vec2 texRes = (uTextureResolution.x < 1.0) ? vec2(1.0, 1.0) : uTextureResolution;
    vec2 sampleUv = getCoverUv(centerUv, uResolution, texRes);

    vec4 texColor = texture2D(uTexture, sampleUv);

    // 4. Calculate Brightness
    float brightness = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));
    if (uInvert) brightness = 1.0 - brightness;

    // 5. Map Brightness to Char Index
    brightness = clamp(brightness, 0.0, 0.99);
    float charIndex = floor(brightness * uCharCount);

    // 6. Sample Char Texture
    vec2 localUv = fract(vUv * cellCount);
    float charSlotWidth = 1.0 / uCharCount;
    float u = (localUv.x * charSlotWidth) + (charIndex * charSlotWidth);
    float v = localUv.y;

    vec4 charSample = texture2D(uCharTexture, vec2(u, v));

    // 7. Output
    float mask = charSample.r;
    vec3 finalColor = uUseOriginalColor ? texColor.rgb : uColor;

    gl_FragColor = vec4(mix(uBackgroundColor, finalColor, mask), 1.0);
}
`;

// --- Controller Class ---

class AsciiImgEffect {
  private container: HTMLElement;
  private renderer: WebGLRenderer;
  private scene: Scene;
  private camera: OrthographicCamera;
  private material: ShaderMaterial;
  private quad: Mesh;
  private imgTexture: Texture;
  private charTexture: Texture;
  private resizeObserver: ResizeObserver;

  // Configuration state
  private config: Required<
    Pick<
      AsciiImgProps,
      "chars" | "fontSize" | "color" | "backgroundColor" | "invert"
    >
  >;

  constructor(
    container: HTMLElement,
    src: string,
    config: Required<
      Pick<
        AsciiImgProps,
        "chars" | "fontSize" | "color" | "backgroundColor" | "invert"
      >
    >,
  ) {
    this.container = container;
    this.config = config;

    // 1. Init Renderer
    const width = container.clientWidth;
    const height = container.clientHeight;

    this.renderer = new WebGLRenderer({
      alpha: true,
      antialias: false,
      powerPreference: "high-performance",
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(config.backgroundColor);
    container.appendChild(this.renderer.domElement);

    // 2. Init Scene & Camera
    this.scene = new Scene();
    this.camera = new OrthographicCamera(
      width / -2,
      width / 2,
      height / 2,
      height / -2,
      1,
      1000,
    );
    this.camera.position.z = 1;

    // 3. Init Textures
    const textureLoader = new TextureLoader();
    this.imgTexture = textureLoader.load(src, (tex) => {
      this.material.uniforms.uTextureResolution.value.set(
        tex.image.width,
        tex.image.height,
      );
      this.render(); // Render once loaded
    });
    this.imgTexture.minFilter = LinearFilter;
    this.imgTexture.magFilter = LinearFilter;
    this.imgTexture.format = RGBAFormat;

    this.charTexture = this.createCharTexture(config.chars);

    // 4. Init Material
    this.material = new ShaderMaterial({
      uniforms: {
        uTexture: { value: this.imgTexture },
        uCharTexture: { value: this.charTexture },
        uResolution: { value: new Vector2(width, height) },
        uTextureResolution: { value: new Vector2(1, 1) },
        uGridSize: {
          value: new Vector2(width / config.fontSize, height / config.fontSize),
        },
        uCharCount: { value: config.chars.length },
        uColor: {
          value: new Color(
            config.color === "original" ? "#ffffff" : config.color,
          ),
        },
        uUseOriginalColor: { value: config.color === "original" },
        uInvert: { value: config.invert },
        uBackgroundColor: { value: new Color(config.backgroundColor) },
      },
      vertexShader,
      fragmentShader,
    });

    // 5. Init Geometry & Mesh
    const geometry = new PlaneGeometry(width, height);
    this.quad = new Mesh(geometry, this.material);
    this.scene.add(this.quad);

    // 6. Observers
    this.resizeObserver = new ResizeObserver(this.handleResize.bind(this));
    this.resizeObserver.observe(container);

    // Initial Render (might be black if texture not loaded, but handled by load callback)
    this.render();
  }

  private createCharTexture(chars: string): Texture {
    const canvas = document.createElement("canvas");
    const numChars = chars.length;
    const renderSize = 64;

    canvas.width = renderSize * numChars;
    canvas.height = renderSize;

    const ctx = canvas.getContext("2d");
    if (!ctx) return new Texture();

    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = `bold ${renderSize}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";

    for (let i = 0; i < numChars; i++) {
      ctx.fillText(
        chars[i],
        i * renderSize + renderSize / 2,
        renderSize / 2 + renderSize * 0.05,
      );
    }

    const tex = new CanvasTexture(canvas);
    tex.minFilter = LinearMipMapLinearFilter;
    tex.magFilter = LinearFilter;
    tex.generateMipmaps = true;
    tex.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
    return tex;
  }

  private handleResize = () => {
    if (!this.container || !this.renderer) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.renderer.setSize(width, height);

    this.camera.left = width / -2;
    this.camera.right = width / 2;
    this.camera.top = height / 2;
    this.camera.bottom = height / -2;
    this.camera.updateProjectionMatrix();

    this.quad.geometry.dispose();
    this.quad.geometry = new PlaneGeometry(width, height);

    this.material.uniforms.uResolution.value.set(width, height);
    this.material.uniforms.uGridSize.value.set(
      width / this.config.fontSize,
      height / this.config.fontSize,
    );

    this.render();
  };

  private render() {
    this.renderer.render(this.scene, this.camera);
  }

  public updateConfig(
    newConfig: Required<
      Pick<
        AsciiImgProps,
        "chars" | "fontSize" | "color" | "backgroundColor" | "invert"
      >
    >,
  ) {
    const oldConfig = this.config;
    this.config = newConfig;
    let needsRender = false;

    // 1. Update Chars
    if (oldConfig.chars !== newConfig.chars) {
      const newCharTexture = this.createCharTexture(newConfig.chars);
      this.material.uniforms.uCharTexture.value = newCharTexture;
      this.material.uniforms.uCharCount.value = newConfig.chars.length;
      this.charTexture.dispose();
      this.charTexture = newCharTexture;
      needsRender = true;
    }

    // 2. Update Grid
    if (oldConfig.fontSize !== newConfig.fontSize) {
      const { x, y } = this.material.uniforms.uResolution.value;
      this.material.uniforms.uGridSize.value.set(
        x / newConfig.fontSize,
        y / newConfig.fontSize,
      );
      needsRender = true;
    }

    // 3. Update Colors
    if (
      oldConfig.color !== newConfig.color ||
      oldConfig.backgroundColor !== newConfig.backgroundColor ||
      oldConfig.invert !== newConfig.invert
    ) {
      this.renderer.setClearColor(newConfig.backgroundColor);
      this.material.uniforms.uBackgroundColor.value.set(
        newConfig.backgroundColor,
      );
      this.material.uniforms.uColor.value.set(
        newConfig.color === "original" ? "#ffffff" : newConfig.color,
      );
      this.material.uniforms.uUseOriginalColor.value =
        newConfig.color === "original";
      this.material.uniforms.uInvert.value = newConfig.invert;
      needsRender = true;
    }

    if (needsRender) this.render();
  }

  public dispose() {
    this.resizeObserver.disconnect();

    this.renderer.dispose();
    this.charTexture.dispose();
    this.imgTexture.dispose();
    this.material.dispose();
    this.quad.geometry.dispose();

    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}

// --- React Component ---

const AsciiImg: React.FC<AsciiImgProps> = ({
  src,
  chars = DEFAULT_CHARS,
  fontSize = 10,
  className,
  color = "#ffffff",
  backgroundColor = "#000000",
  invert = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const effectRef = useRef<AsciiImgEffect | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    effectRef.current = new AsciiImgEffect(containerRef.current, src, {
      chars,
      fontSize,
      color,
      backgroundColor,
      invert,
    });

    return () => {
      effectRef.current?.dispose();
      effectRef.current = null;
    };
    // Re-init if src changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  // Handle Prop Updates
  useEffect(() => {
    if (effectRef.current) {
      effectRef.current.updateConfig({
        chars,
        fontSize,
        color,
        backgroundColor,
        invert,
      });
    }
  }, [chars, fontSize, color, backgroundColor, invert]);

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full h-full overflow-hidden", className)}
    />
  );
};

export default AsciiImg;
