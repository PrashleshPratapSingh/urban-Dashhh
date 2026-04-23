/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function Environment({ speed }: { speed: number }) {
  const floorRef = useRef<THREE.Mesh>(null);
  const wallLeftRef = useRef<THREE.Mesh>(null);
  const wallRightRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
      if (floorRef.current && !Array.isArray(floorRef.current.material)) {
        const material = floorRef.current.material;
        material.userData.offset = (material.userData.offset || 0) + delta * speed;
        const offset = material.userData.offset;
        
        floorRef.current.position.z = (offset % 10);
        if (wallLeftRef.current) wallLeftRef.current.position.z = (offset % 10);
        if (wallRightRef.current) wallRightRef.current.position.z = (offset % 10);
      }
  });

  return (
    <group>
      {/* Main Track */}
      <mesh ref={floorRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[10, 500, 1, 50]} />
        <meshStandardMaterial color="#27272a" wireframe={false} />
      </mesh>

      {/* Grid Lines */}
      <gridHelper args={[10, 10, 0x52525b, 0x52525b]} position={[0, 0.01, 0]} rotation={[0, 0, 0]} />

      {/* Side Walls */}
      <mesh ref={wallLeftRef} position={[-5, 5, 0]}>
        <boxGeometry args={[0.5, 10, 500]} />
        <meshStandardMaterial color="#3f3f46" />
      </mesh>
      <mesh ref={wallRightRef} position={[5, 5, 0]}>
        <boxGeometry args={[0.5, 10, 500]} />
        <meshStandardMaterial color="#3f3f46" />
      </mesh>

      {/* Atmospheric Lighting */}
      <ambientLight intensity={1.5} />
    </group>
  );
}
