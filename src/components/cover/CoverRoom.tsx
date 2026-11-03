"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";

// The opening room of the hero, live: an endless glossy black floor under drifting wine fog.
// Pointer or touch-drag turns the head a little, and the fog parts around where you point.

const INK = 0x0a0607;

function puffTexture(): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, "rgba(255,255,255,0.55)");
  r.addColorStop(0.45, "rgba(255,255,255,0.18)");
  r.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = r;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const hazeShader = {
  uniforms: { uTime: { value: 0 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: `
    varying vec2 vUv; uniform float uTime;
    void main(){
      // Wide, low glow centred left of middle (as in the hero's first frame), fading into the floor line.
      vec2 p = (vUv - vec2(0.38, 0.2)) * vec2(1.3, 3.2);
      float glow = exp(-dot(p, p) * 2.2);
      float band = exp(-pow((vUv.y - 0.215) * 9.0, 2.0));
      vec3 wine = vec3(0.30, 0.05, 0.10);
      vec3 rose = vec3(0.42, 0.20, 0.23);
      vec3 fogc = vec3(0.165, 0.055, 0.082);
      vec3 ink = vec3(0.039, 0.024, 0.027);
      vec3 lit = mix(wine, rose, glow) * (0.7 + 0.5 * glow);
      vec3 col = mix(fogc, lit, clamp(glow * 0.85 + band * 0.25, 0.0, 1.0));
      col = mix(col, ink, smoothstep(0.24, 0.62, vUv.y) * (1.0 - glow * 0.6));
      col *= 0.94 + 0.06 * sin(uTime * 0.4);
      gl_FragColor = vec4(col, 1.0);
    }`,
};

export default function CoverRoom() {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    } catch {
      return; // no WebGL: the CSS gradient under the canvas stays as the room
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(INK, 1);
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x2a0e15, 0.03);
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);

    // Far haze wall: the wine glow on the horizon the fog sits in.
    const haze = new THREE.Mesh(
      new THREE.PlaneGeometry(220, 60),
      new THREE.ShaderMaterial({ ...hazeShader, depthWrite: false, fog: false }),
    );
    haze.position.set(0, 18, -70);
    scene.add(haze);

    // The glossy floor.
    const floor = new Reflector(new THREE.PlaneGeometry(400, 400), {
      color: new THREE.Color(0x7a4a54),
      textureWidth: 1024,
      textureHeight: 1024,
    });
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);
    // A dark veil just above it, so the reflection reads as polished black rather than a mirror.
    const veil = new THREE.Mesh(
      new THREE.PlaneGeometry(400, 400),
      new THREE.MeshBasicMaterial({ color: INK, transparent: true, opacity: 0.55, depthWrite: false }),
    );
    veil.rotation.x = -Math.PI / 2;
    veil.position.y = 0.002;
    scene.add(veil);

    // Ground mist drawn over the horizon so floor and haze melt into each other with no line.
    const mist = new THREE.Mesh(
      new THREE.PlaneGeometry(260, 10),
      new THREE.ShaderMaterial({
        transparent: true,
        depthTest: false,
        depthWrite: false,
        fog: false,
        vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `varying vec2 vUv; void main(){
          float a = exp(-pow((vUv.y - 0.5) * 7.0, 2.0)) * smoothstep(0.0, 0.25, vUv.x) * smoothstep(1.0, 0.75, vUv.x);
          gl_FragColor = vec4(vec3(0.27, 0.09, 0.13), a * 0.85);
        }`,
      }),
    );
    mist.position.set(0, 0, -60);
    mist.renderOrder = 10;
    scene.add(mist);

    // Fog banks.
    const tex = puffTexture();
    const tints = [0x7a3a48, 0x4e1c28, 0x3e1620, 0x2a1418, 0x8a4a56];
    type Puff = { s: THREE.Sprite; home: THREE.Vector3; drift: number; phase: number; push: THREE.Vector2 };
    const puffs: Puff[] = [];
    const count = window.innerWidth < 700 ? 46 : 80;
    for (let i = 0; i < count; i++) {
      const m = new THREE.SpriteMaterial({
        map: tex,
        color: tints[i % tints.length],
        transparent: true,
        opacity: 0.05 + Math.random() * 0.12,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const s = new THREE.Sprite(m);
      const z = -8 - Math.random() * 46;
      const x = (Math.random() ** 1.4 - 0.45) * (30 + -z * 1.4);
      const size = 6 + Math.random() * 10 + -z * 0.12;
      s.scale.set(size * 1.6, size, 1);
      const home = new THREE.Vector3(x, size * 0.28 + Math.random() * 1.2, z);
      s.position.copy(home);
      scene.add(s);
      puffs.push({ s, home, drift: 0.15 + Math.random() * 0.35, phase: Math.random() * Math.PI * 2, push: new THREE.Vector2() });
    }

    // Input: pointer position turns the view; dragging turns it further.
    const look = { x: 0, y: 0, tx: 0, ty: 0, drag: 0, tdrag: 0 };
    const pointer = new THREE.Vector2(0, -0.2);
    let dragging: { x: number; base: number } | null = null;
    const onMove = (e: PointerEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      pointer.set(nx, -ny);
      if (e.pointerType === "mouse") {
        look.tx = nx;
        look.ty = ny;
      }
      if (dragging) look.tdrag = Math.max(-1, Math.min(1, dragging.base + ((e.clientX - dragging.x) / window.innerWidth) * 1.6));
    };
    const onDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest("button, input, a, form")) return;
      dragging = { x: e.clientX, base: look.tdrag };
    };
    const onUp = () => {
      dragging = null;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("pointercancel", onUp, { passive: true });

    const resize = () => {
      const w = el.clientWidth, h = el.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.fov = w / h < 0.8 ? 58 : 42;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    const ray = new THREE.Raycaster();
    const hit = new THREE.Vector3();
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const clock = new THREE.Clock();
    let raf = 0;
    let running = true;

    const frame = () => {
      raf = requestAnimationFrame(frame);
      if (!running) return;
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;
      const k = 1 - Math.exp(-dt * 3);
      look.x += (look.tx - look.x) * k;
      look.y += (look.ty - look.y) * k;
      look.drag += (look.tdrag - look.drag) * (1 - Math.exp(-dt * 5));
      if (!dragging) look.tdrag *= Math.exp(-dt * 0.6); // drifts back to the front

      const yaw = look.x * 0.09 + look.drag * 0.5;
      const pitch = 0.1 + look.y * 0.04;
      const breathe = reduce ? 0 : Math.sin(t * 0.25) * 0.05;
      camera.position.set(Math.sin(yaw) * 2.5, 1.35 + breathe, 6 + Math.cos(yaw) * 0.6);
      camera.rotation.set(pitch, yaw, 0, "YXZ");

      // Where the pointer lands in the fog, 18 units out.
      ray.setFromCamera(pointer, camera);
      plane.constant = 18 - camera.position.z;
      const has = ray.ray.intersectPlane(plane, hit);

      for (const p of puffs) {
        const wob = reduce ? 0 : t * p.drift;
        let tx = 0, ty = 0;
        if (has) {
          const dx = p.s.position.x - hit.x;
          const dy = p.s.position.y - hit.y;
          const dz = (p.s.position.z - hit.z) * 0.25;
          const d2 = dx * dx + dy * dy + dz * dz;
          const f = Math.exp(-d2 / 30) * 4;
          tx = (dx / Math.sqrt(d2 + 0.01)) * f;
          ty = Math.max(0, dy / Math.sqrt(d2 + 0.01)) * f * 0.5;
        }
        p.push.x += (tx - p.push.x) * (1 - Math.exp(-dt * 2));
        p.push.y += (ty - p.push.y) * (1 - Math.exp(-dt * 2));
        p.s.position.set(
          p.home.x + Math.sin(wob + p.phase) * 1.8 + p.push.x,
          p.home.y + Math.sin(wob * 0.7 + p.phase) * 0.3 + p.push.y,
          p.home.z,
        );
        p.s.material.rotation = Math.sin(wob * 0.3 + p.phase) * 0.3;
      }
      (haze.material as THREE.ShaderMaterial).uniforms.uTime.value = t;
      renderer.render(scene, camera);
    };
    frame();

    const onVis = () => {
      running = document.visibilityState === "visible";
      clock.getDelta();
    };
    document.addEventListener("visibilitychange", onVis);
    requestAnimationFrame(() => el.classList.add("is-live"));

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      floor.dispose();
      tex.dispose();
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose();
        const mat = m.material as THREE.Material | undefined;
        mat?.dispose();
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={host} className="cover-room" aria-hidden />;
}
