/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { LANES } from '../constants';

interface PlayerProps {
  lane: number;
  y: number;
}

export function Player({ lane, y }: PlayerProps) {
  const meshRef = useRef<THREE.Group>(null);
  const targetX = LANES[lane];

  useFrame((state, delta) => {
    if (meshRef.current) {
      // Smooth lane switching
      meshRef.current.position.x = THREE.MathUtils.lerp(
        meshRef.current.position.x,
        targetX,
        delta * 15
      );
      
      // Vertical position (jump/fall)
      meshRef.current.position.y = y + 0.5; // Offset for height

      // Lean into the turn
      const tilt = (targetX - meshRef.current.position.x) * 0.2;
      meshRef.current.rotation.z = THREE.MathUtils.lerp(
        meshRef.current.rotation.z,
        -tilt,
        delta * 10
      );

      // Running animation (slight bounce)
      if (y === 0) {
        meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 15) * 0.05;
      } else {
        meshRef.current.rotation.x = -0.2; // Lean forward while jumping
      }
    }
  });

  return (
    <group ref={meshRef}>
      {/* Body */}
      <mesh castShadow position={[0, 0.5, 0]}>
        <boxGeometry args={[0.6, 1, 0.4]} />
        <meshStandardMaterial color="#2563eb" />
      </mesh>
      {/* Head */}
      <mesh castShadow position={[0, 1.2, 0]}>
        <boxGeometry args={[0.4, 0.4, 0.4]} />
        <meshStandardMaterial color="#f9a8d4" />
      </mesh>
      {/* Eyes */}
      <mesh position={[0.1, 1.25, 0.21]}>
        <boxGeometry args={[0.05, 0.05, 0.05]} />
        <meshStandardMaterial color="white" />
      </mesh>
      <mesh position={[-0.1, 1.25, 0.21]}>
        <boxGeometry args={[0.05, 0.05, 0.05]} />
        <meshStandardMaterial color="white" />
      </mesh>
      {/* Feet */}
      <mesh position={[0.15, 0, 0]}>
        <boxGeometry args={[0.2, 0.2, 0.3]} />
        <meshStandardMaterial color="#18181b" />
      </mesh>
      <mesh position={[-0.15, 0, 0]}>
        <boxGeometry args={[0.2, 0.2, 0.3]} />
        <meshStandardMaterial color="#18181b" />
      </mesh>
    </group>
  );
}
