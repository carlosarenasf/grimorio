import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { DieType } from './Dice3D';

export interface DiceCanvasProps {
  /** One entry per die to show, in order. */
  dice: DieType[];
  rolling: boolean;
  /** Settled per-die results (same order as `dice`); orients each die to its face. */
  results?: (number | null)[] | null;
  tone?: 'normal' | 'crit' | 'fumble';
}

const FACE_RADIUS = 1;

/** Real polyhedral geometry per die type (d10/d100 → pentagonal bipyramid: 10 faces). */
function geometryFor(type: DieType): THREE.BufferGeometry {
  switch (type) {
    case 'd4':
      return new THREE.TetrahedronGeometry(FACE_RADIUS * 1.25);
    case 'd6':
      return new THREE.BoxGeometry(FACE_RADIUS * 1.4, FACE_RADIUS * 1.4, FACE_RADIUS * 1.4);
    case 'd8':
      return new THREE.OctahedronGeometry(FACE_RADIUS * 1.25);
    case 'd12':
      return new THREE.DodecahedronGeometry(FACE_RADIUS * 1.15);
    case 'd20':
      return new THREE.IcosahedronGeometry(FACE_RADIUS * 1.15);
    case 'd10':
    case 'd100':
      return pentagonalBipyramid(FACE_RADIUS * 1.2);
    default:
      return new THREE.IcosahedronGeometry(FACE_RADIUS);
  }
}

/** A 10-faced die shape: a 5-gon equator with two apexes → 10 triangular faces. */
function pentagonalBipyramid(r: number): THREE.BufferGeometry {
  const eq: THREE.Vector3[] = [];
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2;
    eq.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r));
  }
  const top = new THREE.Vector3(0, r * 1.25, 0);
  const bot = new THREE.Vector3(0, -r * 1.25, 0);
  const verts: number[] = [];
  const push = (v: THREE.Vector3) => verts.push(v.x, v.y, v.z);
  for (let k = 0; k < 5; k++) {
    const n = (k + 1) % 5;
    push(top); push(eq[k]!); push(eq[n]!);
    push(bot); push(eq[n]!); push(eq[k]!);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.computeVertexNormals();
  return geo;
}

interface Face {
  center: THREE.Vector3;
  normal: THREE.Vector3;
}

/** Group a geometry's triangles into faces by coplanar (outward) normal. */
function facesOf(geo: THREE.BufferGeometry): Face[] {
  const pos = geo.toNonIndexed().attributes.position as THREE.BufferAttribute;
  const groups = new Map<string, { normal: THREE.Vector3; centers: THREE.Vector3[] }>();
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  for (let i = 0; i < pos.count; i += 3) {
    a.fromBufferAttribute(pos, i);
    b.fromBufferAttribute(pos, i + 1);
    c.fromBufferAttribute(pos, i + 2);
    const normal = new THREE.Vector3()
      .subVectors(c, b)
      .cross(new THREE.Vector3().subVectors(a, b))
      .normalize();
    const centroid = a.clone().add(b).add(c).multiplyScalar(1 / 3);
    if (normal.dot(centroid) < 0) normal.negate(); // ensure outward
    const key = `${Math.round(normal.x * 50)},${Math.round(normal.y * 50)},${Math.round(normal.z * 50)}`;
    const g = groups.get(key) ?? { normal, centers: [] };
    g.centers.push(centroid);
    groups.set(key, g);
  }
  return [...groups.values()].map((g) => ({
    normal: g.normal,
    center: g.centers
      .reduce((acc, v) => acc.add(v), new THREE.Vector3())
      .multiplyScalar(1 / g.centers.length),
  }));
}

/** A small canvas texture with a number, drawn for a die face. */
function numberTexture(text: string, color: string): THREE.Texture {
  const size = 128;
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d')!;
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = color;
  ctx.font = 'bold 76px JetBrains Mono, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, size / 2, size / 2 + 4);
  const tex = new THREE.CanvasTexture(cv);
  tex.anisotropy = 4;
  return tex;
}

const TONE_NUM_COLOR = { normal: '#e8e2d0', crit: '#c9a227', fumble: '#e0917f' };

interface DieObj {
  group: THREE.Group;
  faces: Face[];
  vel: THREE.Vector3;
  target: THREE.Quaternion | null;
}

export function DiceCanvas({ dice, rolling, results, tone = 'normal' }: DiceCanvasProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  // Live state the animation loop reads without re-running the scene effect.
  const stateRef = useRef({ rolling, results: results ?? null, tone });
  stateRef.current = { rolling, results: results ?? null, tone };

  const key = dice.join(',');

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch {
      return; // no WebGL (e.g. jsdom) — render nothing
    }
    const width = mount.clientWidth || 480;
    const height = mount.clientHeight || 150;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 1.5, 9);
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.HemisphereLight(0xece7d6, 0x14121c, 1.1));
    const dir = new THREE.DirectionalLight(0xffffff, 1.4);
    dir.position.set(3, 6, 5);
    scene.add(dir);
    const rim = new THREE.PointLight(0xc9a227, 0.6, 40);
    rim.position.set(-4, 2, 6);
    scene.add(rim);

    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const numColor = TONE_NUM_COLOR[stateRef.current.tone];
    const dieObjs: DieObj[] = dice.slice(0, 30).map((type) => {
      const geo = geometryFor(type);
      const faces = facesOf(geo);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x2a2640,
        metalness: 0.35,
        roughness: 0.45,
        flatShading: true,
      });
      const mesh = new THREE.Mesh(geo, mat);
      const group = new THREE.Group();
      group.add(mesh);
      faces.forEach((f, idx) => {
        const label = type === 'd10' || type === 'd100' ? String(idx) : String(idx + 1);
        const tex = numberTexture(label, numColor);
        const plane = new THREE.Mesh(
          new THREE.PlaneGeometry(0.7, 0.7),
          new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }),
        );
        plane.position.copy(f.center).multiplyScalar(1.02);
        plane.lookAt(f.center.clone().add(f.normal));
        group.add(plane);
      });
      group.quaternion.setFromEuler(
        new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI),
      );
      scene.add(group);
      return {
        group,
        faces,
        vel: new THREE.Vector3(
          2 + Math.random() * 3,
          2 + Math.random() * 3,
          1 + Math.random() * 2,
        ),
        target: null,
      };
    });

    // Lay dice out in a centered row.
    const spacing = 2.6;
    const offset = ((dieObjs.length - 1) * spacing) / 2;
    dieObjs.forEach((d, i) => {
      d.group.position.x = i * spacing - offset;
    });
    // Fit camera distance to the row width.
    camera.position.z = Math.max(7, offset + 6);

    let lastResultsKey = '';
    let raf = 0;
    let prev = performance.now();
    const tmpQ = new THREE.Quaternion();
    const zAxis = new THREE.Vector3(0, 0, 1);

    function frame(now: number) {
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      const st = stateRef.current;

      // When results arrive, compute each die's target orientation (matching face → camera).
      const rk = (st.results ?? []).join(',');
      if (!st.rolling && st.results && rk !== lastResultsKey) {
        lastResultsKey = rk;
        dieObjs.forEach((d, i) => {
          const val = st.results![i];
          if (val == null) {
            d.target = d.group.quaternion.clone();
            return;
          }
          const faceIdx = d.faces.findIndex((_, fi) => {
            const t = dice[i];
            const label = t === 'd10' || t === 'd100' ? fi : fi + 1;
            return label === val;
          });
          const face = d.faces[Math.max(0, faceIdx)] ?? d.faces[0]!;
          d.target = tmpQ.setFromUnitVectors(face.normal.clone().normalize(), zAxis).clone();
        });
      }
      if (st.rolling) lastResultsKey = '';

      for (const d of dieObjs) {
        if (st.rolling && !reduce) {
          d.group.rotation.x += d.vel.x * dt;
          d.group.rotation.y += d.vel.y * dt;
          d.group.rotation.z += d.vel.z * dt;
          d.target = null;
        } else if (d.target) {
          d.group.quaternion.slerp(d.target, reduce ? 1 : 0.18);
        }
      }

      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    const onResize = () => {
      const w = mount.clientWidth || width;
      const h = mount.clientHeight || height;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(mount);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.dispose();
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          const m = o.material as THREE.Material | THREE.Material[];
          (Array.isArray(m) ? m : [m]).forEach((mm) => mm.dispose());
        }
      });
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
    // Rebuild the scene only when the dice set changes (key = dice types).
  }, [key]);

  return <div ref={mountRef} className="dice-canvas" aria-hidden="true" />;
}
