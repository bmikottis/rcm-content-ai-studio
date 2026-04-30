"use client";

import { useEffect, useRef, memo } from "react";

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
varying vec2 vUv;
uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform vec3 uColor4;
uniform vec3 uLightPos;
uniform float uDepth;
uniform float uSpeed;
uniform float uNoiseScale;
uniform float uWarpAmount;
uniform float uFoldFrequency;
uniform float uAngle;
uniform float uConnections;
uniform float uShadowWidth;

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  vec4 m = max(0.5 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 105.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

float getSurface(vec2 p) {
  float c = cos(uAngle), s = sin(uAngle);
  mat2 rot = mat2(c, -s, s, c);
  vec2 rp = rot * p;
  float n1 = snoise(vec3(rp * uNoiseScale * 0.25, uTime * uSpeed * 0.7));
  float n2 = snoise(vec3(rp * uNoiseScale * 0.25 + vec2(21.4, 15.2), uTime * uSpeed * 0.9));
  float trig1 = sin(rp.x * uNoiseScale * 0.5 + uTime * uSpeed) * 0.3;
  float trig2 = cos(rp.y * uNoiseScale * 0.5 - uTime * uSpeed) * 0.3;
  vec2 flow = vec2(n1 + trig1, n2 + trig2);
  vec2 wp = rp + flow * (uWarpAmount * 0.12);
  float freq = uFoldFrequency * 0.5;
  float phase = sin(wp.y * freq + flow.y * 2.0) * uConnections;
  float mainWave = sin(wp.x * freq + phase * uWarpAmount * 0.3);
  float n3 = snoise(vec3(wp * 0.5, uTime * uSpeed * 0.5));
  return (mainWave * 0.85 + n3 * 0.15) * 0.5;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution.xy;
  vec2 p = uv * 2.0 - 1.0;
  p.x *= uResolution.x / uResolution.y;
  vec2 e = vec2(0.09, 0.0);
  float dx = (getSurface(p + e.xy) - getSurface(p - e.xy)) / (2.0 * e.x);
  float dy = (getSurface(p + e.yx) - getSurface(p - e.yx)) / (2.0 * e.x);
  float safeDepth = max(uDepth, 0.02);
  vec3 normal = normalize(vec3(-dx, -dy, safeDepth));
  vec3 lightDir = normalize(uLightPos);
  float diffuse = dot(normal, lightDir) * 0.5 + 0.5;
  float t = diffuse;
  t += getSurface(p) * 0.04;
  t = clamp(t, 0.0, 1.0);
  t = t * t * (3.0 - 2.0 * t);
  vec3 color = mix(uColor1, uColor2, smoothstep(0.0, uShadowWidth + 0.15, t));
  color = mix(color, uColor3, smoothstep(uShadowWidth + 0.05, 0.65, t));
  color = mix(color, uColor4, smoothstep(0.55, 1.05, t));
  float grain = fract(sin(dot(uv.xy, vec2(12.9898,78.233))) * 43758.5453);
  color += (grain - 0.5) * 0.02;
  gl_FragColor = vec4(color, 1.0);
}
`;

// Salesforce-inspired color palette with indigo/purple and cyan
const COLORS = {
  color1: "#032D60", // Deep Salesforce navy (deep blue)
  color2: "#5A67D8", // Soft indigo / purple
  color3: "#6B5ACC", // Salesforce purple
  color4: "#22D3EE", // Subtle cyan highlight
};

interface OrganicBackgroundProps {
  className?: string;
}

function OrganicBackgroundComponent({ className }: OrganicBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (!containerRef.current) return;

    // Dynamically import Three.js
    import("three").then((THREE) => {
      const container = containerRef.current;
      if (!container) return;

      const width = container.clientWidth;
      const height = container.clientHeight;

      // Scene setup
      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
      camera.position.z = 1;

      // Renderer with performance optimizations
      const renderer = new THREE.WebGLRenderer({
        antialias: false,
        powerPreference: "low-power",
        alpha: true,
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Limit pixel ratio for performance
      container.appendChild(renderer.domElement);

      // Material
      const material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uResolution: { value: new THREE.Vector2(width, height) },
          uColor1: { value: new THREE.Color(COLORS.color1) },
          uColor2: { value: new THREE.Color(COLORS.color2) },
          uColor3: { value: new THREE.Color(COLORS.color3) },
          uColor4: { value: new THREE.Color(COLORS.color4) },
          uDepth: { value: 0.04 },
          uLightPos: { value: new THREE.Vector3(0.968, -0.36, 1.0) },
          uSpeed: { value: 0.08 }, // Slightly slower for subtlety
          uNoiseScale: { value: 0.714 },
          uWarpAmount: { value: 4.0 },
          uFoldFrequency: { value: 1.865 },
          uAngle: { value: 1.08699 },
          uConnections: { value: 0.8715 },
          uShadowWidth: { value: 0.01 },
        },
      });

      // Geometry & Mesh
      const geometry = new THREE.PlaneGeometry(2, 2);
      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      // Animation with throttling for performance
      const clock = new THREE.Clock();
      let lastTime = 0;
      const targetFPS = 30; // Limit to 30 FPS for better performance
      const frameInterval = 1000 / targetFPS;

      const animate = (currentTime: number) => {
        frameRef.current = requestAnimationFrame(animate);

        const delta = currentTime - lastTime;
        if (delta < frameInterval) return;
        lastTime = currentTime - (delta % frameInterval);

        material.uniforms.uTime.value = clock.getElapsedTime();
        renderer.render(scene, camera);
      };

      frameRef.current = requestAnimationFrame(animate);

      // Resize handler with debounce
      let resizeTimeout: NodeJS.Timeout;
      const handleResize = () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          if (!container) return;
          const newWidth = container.clientWidth;
          const newHeight = container.clientHeight;
          renderer.setSize(newWidth, newHeight);
          material.uniforms.uResolution.value.set(newWidth, newHeight);
        }, 100);
      };

      const resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(container);

      // Cleanup
      return () => {
        cancelAnimationFrame(frameRef.current);
        clearTimeout(resizeTimeout);
        resizeObserver.disconnect();
        renderer.dispose();
        geometry.dispose();
        material.dispose();
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      };
    });
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    />
  );
}

export const OrganicBackground = memo(OrganicBackgroundComponent);
