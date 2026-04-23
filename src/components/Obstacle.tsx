/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ObstacleData, LANES } from '../constants';

export function Obstacle({ data }: { data: ObstacleData }) {
  const x = LANES[data.lane];
  
  if (data.type === 'barrier') {
    return (
      <group position={[x, 0.5, data.z]}>
        <mesh castShadow>
          <boxGeometry args={[1.5, 0.8, 0.2]} />
          <meshStandardMaterial color="#dc2626" />
        </mesh>
        <mesh position={[0, -0.2, 0]}>
          <boxGeometry args={[1.6, 0.4, 0.1]} />
          <meshStandardMaterial color="white" />
        </mesh>
      </group>
    );
  }

  if (data.type === 'train') {
    return (
      <mesh position={[x, 1, data.z]} castShadow>
        <boxGeometry args={[1.8, 2, 6]} />
        <meshStandardMaterial color="#dc2626" />
        {/* Roof line */}
        <mesh position={[0, 1.01, 0]}>
          <planeGeometry args={[1.7, 5.8]} />
          <meshStandardMaterial color="white" />
        </mesh>
        {/* Windows */}
        <mesh position={[0, 0.5, 3.01]}>
          <planeGeometry args={[1.4, 0.8]} />
          <meshStandardMaterial color="#18181b" />
        </mesh>
      </mesh>
    );
  }

  if (data.type === 'coin') {
    return (
      <mesh position={[x, 0.5, data.z]} castShadow rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.3, 0.3, 0.1, 16]} />
        <meshStandardMaterial color="#facc15" emissive="#fef08a" emissiveIntensity={0.5} />
      </mesh>
    );
  }

  if (data.type === 'gem') {
    return (
      <mesh position={[x, 0.8, data.z]} castShadow rotation={[Math.PI / 4, 0, Math.PI / 4]}>
        <octahedronGeometry args={[0.4]} />
        <meshStandardMaterial color="#06b6d4" emissive="#22d3ee" emissiveIntensity={0.8} />
      </mesh>
    );
  }

  if (data.type === 'special_token') {
    return (
      <mesh position={[x, 1, data.z]} castShadow rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[0.4, 0.1, 8, 24]} />
        <meshStandardMaterial color="#8b5cf6" emissive="#a78bfa" emissiveIntensity={0.5} />
      </mesh>
    );
  }

  return null;
}
