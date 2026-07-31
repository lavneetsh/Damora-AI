'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

interface AiBrainCanvasProps {
  activeCluster: string | null;
}

const CLUSTERS = [
  { name: 'Finance', color: new THREE.Color('#3b8ef8'), center: [0.6, 0.8, 0.2] },
  { name: 'HR', color: new THREE.Color('#10b981'), center: [-0.7, 0.5, 0.6] },
  { name: 'Legal', color: new THREE.Color('#f59e0b'), center: [-0.3, -0.7, 0.5] },
  { name: 'Engineering', color: new THREE.Color('#6c3bfa'), center: [0.5, -0.3, -0.7] },
  { name: 'Sales', color: new THREE.Color('#ec4899'), center: [-0.5, 0.2, -0.8] },
] as const;

const POINT_COUNT = 1500;

function EmbeddingSphere({ activeCluster }: AiBrainCanvasProps) {
  const meshRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);

  const { positions, colors, clusterIndices } = useMemo(() => {
    const pos = new Float32Array(POINT_COUNT * 3);
    const col = new Float32Array(POINT_COUNT * 3);
    const indices = new Array(POINT_COUNT);

    for (let i = 0; i < POINT_COUNT; i++) {
      // Assign to a random cluster
      const ci = Math.floor(Math.random() * CLUSTERS.length);
      const cluster = CLUSTERS[ci];
      indices[i] = ci;

      // Generate point on a sphere with cluster bias
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 1.8 + (Math.random() - 0.5) * 0.6;

      // Base position on sphere
      const bx = r * Math.sin(phi) * Math.cos(theta);
      const by = r * Math.sin(phi) * Math.sin(theta);
      const bz = r * Math.cos(phi);

      // Bias towards cluster center (subtle grouping)
      const bias = 0.5 + Math.random() * 0.3;
      pos[i * 3] = bx + cluster.center[0] * bias;
      pos[i * 3 + 1] = by + cluster.center[1] * bias;
      pos[i * 3 + 2] = bz + cluster.center[2] * bias;

      // Color
      col[i * 3] = cluster.color.r;
      col[i * 3 + 1] = cluster.color.g;
      col[i * 3 + 2] = cluster.color.b;
    }

    return { positions: pos, colors: col, clusterIndices: indices };
  }, []);

  // Rotate slowly
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.08;
      meshRef.current.rotation.x += delta * 0.02;
    }

    // Highlight active cluster by adjusting point sizes
    if (materialRef.current) {
      // Base size with subtle pulse when cluster is active
      materialRef.current.size = activeCluster ? 2.5 : 2;
    }
  });

  return (
    <Points ref={meshRef} positions={positions} colors={colors} stride={3}>
      <PointMaterial
        ref={materialRef}
        transparent
        vertexColors
        size={2}
        sizeAttenuation
        depthWrite={false}
        opacity={0.8}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

export default function AiBrainCanvas({ activeCluster }: AiBrainCanvasProps) {
  return (
    <div className="w-full h-[380px] md:h-[480px] rounded-2xl overflow-hidden bg-black/20 border border-white/[0.04]">
      <Canvas
        camera={{ position: [0, 0, 5.5], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.3} />
        <EmbeddingSphere activeCluster={activeCluster} />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.3}
          maxPolarAngle={Math.PI * 0.75}
          minPolarAngle={Math.PI * 0.25}
        />
      </Canvas>
    </div>
  );
}
