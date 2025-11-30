"use client";

import React, { useEffect, useRef, useCallback } from "react";
import {
  Scene,
  OrthographicCamera,
  PlaneGeometry,
  ShaderMaterial,
  Mesh,
  WebGLRenderer,
  VideoTexture,
  LinearFilter,
  ClampToEdgeWrapping,
  DoubleSide,
  DataTexture,
  RGBAFormat,
  FloatType,
  NearestFilter,
} from "three";

type PixelatedVideoProps = {
  src: string;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  playsInline?: boolean;
  preload?: string;
  grid?: number;
  mouse?: number;
  strength?: number;
  relaxation?: number;
  mobileBreakpoint?: number;
  mobileEnabled?: boolean;
};

export default function PixelatedVideo({
  src,
  className,
  autoPlay = true,
  muted = true,
  loop = true,
  playsInline = true,
  preload = "auto",
  grid = 25,
  mouse = 0.25,
  strength = 0.1,
  relaxation = 0.925,
  mobileBreakpoint = 1000,
  mobileEnabled = false,
}: PixelatedVideoProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const cameraRef = useRef<OrthographicCamera | null>(null);
  const materialRef = useRef<ShaderMaterial | null>(null);
  const meshRef = useRef<Mesh<PlaneGeometry, ShaderMaterial> | null>(null);
  const rendererRef = useRef<WebGLRenderer | null>(null);
  const videoTextureRef = useRef<VideoTexture | null>(null);
  const animationRef = useRef<number | null>(null);
  const dataTextureRef = useRef<DataTexture | null>(null);
  const destroyedRef = useRef(false);
  const widthRef = useRef(0);
  const heightRef = useRef(0);
  const planeGeometryRef = useRef<PlaneGeometry | null>(null);
  const mouseRef = useRef({ x: 0, y: 0, prevX: 0, prevY: 0, vX: 0, vY: 0 });
  const isMobileRef = useRef(false);

  const createCleanGrid = useCallback(() => {
    const size = grid;
    const totalSize = size * size * 4;
    const data = new Float32Array(totalSize);
    for (let i = 3; i < totalSize; i += 4) data[i] = 255;
    const tex = new DataTexture(data, size, size, RGBAFormat, FloatType);
    tex.magFilter = tex.minFilter = NearestFilter;
    dataTextureRef.current = tex;
    if (materialRef.current) {
      materialRef.current.uniforms.uDataTexture.value = tex;
      materialRef.current.uniforms.uDataTexture.value.needsUpdate = true;
    }
  }, [grid]);

  function updateCameraAndGeometry() {
    if (!containerRef.current || !videoRef.current) return;
    widthRef.current = containerRef.current.clientWidth;
    heightRef.current = containerRef.current.clientHeight;
    const videoWidth = videoRef.current.videoWidth || 1920;
    const videoHeight = videoRef.current.videoHeight || 1080;
    const containerAspect = widthRef.current / Math.max(1, heightRef.current);
    const videoAspect = videoWidth / Math.max(1, videoHeight);
    let scaleX = 1, scaleY = 1;
    if (containerAspect > videoAspect) scaleY = containerAspect / videoAspect; else scaleX = videoAspect / containerAspect;
    cameraRef.current = new OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);
    cameraRef.current.position.z = 1;
    const epsilonX = 2 / Math.max(1, widthRef.current);
    const epsilonY = 2 / Math.max(1, heightRef.current);
    planeGeometryRef.current = new PlaneGeometry(2 * scaleX + epsilonX, 2 * scaleY + epsilonY);
  }

  function createVideoTexture() {
    const tex = new VideoTexture(videoRef.current!);
    tex.minFilter = LinearFilter;
    tex.magFilter = LinearFilter;
    tex.generateMipmaps = false;
    tex.wrapS = ClampToEdgeWrapping;
    tex.wrapT = ClampToEdgeWrapping;
    tex.flipY = true;
    videoTextureRef.current = tex;
    return tex;
  }

  const updateDataTexture = useCallback(() => {
    if (!dataTextureRef.current || isMobileRef.current) return;
    const data = dataTextureRef.current.image.data as unknown as Float32Array;
    const size = grid;
    for (let i = 0; i < data.length; i += 4) {
      data[i] *= relaxation;
      data[i + 1] *= relaxation;
    }
    if (Math.abs(mouseRef.current.vX) < 0.001 && Math.abs(mouseRef.current.vY) < 0.001) {
      mouseRef.current.vX *= 0.9;
      mouseRef.current.vY *= 0.9;
      dataTextureRef.current.needsUpdate = true;
      return;
    }
    const gridMouseX = size * mouseRef.current.x;
    const gridMouseY = size * (1 - mouseRef.current.y);
    const maxDist = size * mouse;
    const maxDistSq = maxDist * maxDist;
    const aspect = heightRef.current / Math.max(1, widthRef.current);
    const strengthFactor = strength * 100;
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const distance = (gridMouseX - i) ** 2 / aspect + (gridMouseY - j) ** 2;
        if (distance < maxDistSq) {
          const index = 4 * (i + size * j);
          const power = Math.min(10, maxDist / Math.sqrt(Math.max(distance, 1e-6)));
          data[index] += strengthFactor * mouseRef.current.vX * power;
          data[index + 1] -= strengthFactor * mouseRef.current.vY * power;
        }
      }
    }
    mouseRef.current.vX *= 0.9;
    mouseRef.current.vY *= 0.9;
    dataTextureRef.current.needsUpdate = true;
  }, [grid, relaxation, mouse, strength]);

  function handlePointerMove(clientX: number, clientY: number) {
    if (isMobileRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const newX = (clientX - rect.left) / rect.width;
    const newY = (clientY - rect.top) / rect.height;
    mouseRef.current.vX = newX - mouseRef.current.prevX;
    mouseRef.current.vY = newY - mouseRef.current.prevY;
    mouseRef.current.prevX = mouseRef.current.x;
    mouseRef.current.prevY = mouseRef.current.y;
    mouseRef.current.x = newX;
    mouseRef.current.y = newY;
  }

  useEffect(() => {
    const container = containerRef.current;
    const videoEl = videoRef.current;
    if (!container || !videoEl) return;
    isMobileRef.current = !mobileEnabled && window.innerWidth < mobileBreakpoint;
    let resizeTimeout: number | null = null;
    const onMouseMove = (e: MouseEvent) => handlePointerMove(e.clientX, e.clientY);
    container.addEventListener("mousemove", onMouseMove);
    const onResize = () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(() => {
        isMobileRef.current = !mobileEnabled && window.innerWidth < mobileBreakpoint;
        updateCameraAndGeometry();
        if (meshRef.current && planeGeometryRef.current) {
          meshRef.current.geometry.dispose();
          meshRef.current.geometry = planeGeometryRef.current;
        }
        if (rendererRef.current) {
          rendererRef.current.setPixelRatio(window.devicePixelRatio || 1);
          rendererRef.current.setSize(widthRef.current, heightRef.current, false);
        }
        createCleanGrid();
      }, 100);
    };
    window.addEventListener("resize", onResize);
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", onResize);
    }
    
    (async () => {
      await new Promise<void>((resolve) => {
        if (videoEl.readyState >= 2) resolve(); else videoEl.addEventListener("loadeddata", () => resolve(), { once: true });
      });
      await new Promise((r) => setTimeout(r, 100));
      const texture = createVideoTexture();
      sceneRef.current = new Scene();
      updateCameraAndGeometry();
      const vertexShader = `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`;
      const fragmentShader = `
        uniform sampler2D uDataTexture;
        uniform sampler2D uTexture;
        varying vec2 vUv;
        void main() {
          vec4 offset = texture2D(uDataTexture, vUv);
          gl_FragColor = texture2D(uTexture, vUv - 0.02 * offset.rg);
        }`;
      materialRef.current = new ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          uTexture: { value: texture },
          uDataTexture: { value: null as unknown as DataTexture },
        },
        vertexShader,
        fragmentShader,
        side: DoubleSide,
      });
      createCleanGrid();
      meshRef.current = new Mesh(planeGeometryRef.current!, materialRef.current);
      sceneRef.current.add(meshRef.current);
      rendererRef.current = new WebGLRenderer({ antialias: true, alpha: false });
      rendererRef.current.setClearColor(0x000000, 1);
      rendererRef.current.setPixelRatio(window.devicePixelRatio || 1);
      rendererRef.current.setSize(widthRef.current, heightRef.current, false);
      const canvas = rendererRef.current.domElement;
      canvas.style.cssText =
        "position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:auto;z-index:0;border:0;outline:none";
      videoEl.style.opacity = "0";
      container.appendChild(canvas);
      function render() {
        if (destroyedRef.current) return;
        updateDataTexture();
        if (videoTextureRef.current) videoTextureRef.current.needsUpdate = true;
        if (materialRef.current) materialRef.current.uniforms.time.value += 0.05;
        rendererRef.current?.render(sceneRef.current!, cameraRef.current!);
        animationRef.current = requestAnimationFrame(render);
      }
      render();
    })();
    return () => {
      destroyedRef.current = true;
      window.removeEventListener("resize", onResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", onResize);
      }
      
      container.removeEventListener("mousemove", onMouseMove);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (rendererRef.current) rendererRef.current.dispose();
      if (materialRef.current) materialRef.current.dispose();
      if (planeGeometryRef.current) planeGeometryRef.current.dispose();
      if (videoTextureRef.current) videoTextureRef.current.dispose();
    };
  }, [src, grid, mouse, strength, relaxation, mobileBreakpoint, mobileEnabled, createCleanGrid, updateDataTexture]);

  return (
    <div ref={containerRef} className={className} style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", border: 0, outline: "none" }}>
      <video ref={videoRef} src={src} autoPlay={autoPlay} muted={muted} loop={loop} playsInline={playsInline} preload={preload} style={{ width: "100%", height: "100%", objectFit: "cover", border: 0, outline: "none" }} />
    </div>
  );
}
