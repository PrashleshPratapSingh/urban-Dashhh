/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Stars } from '@react-three/drei';
import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GameStatus, 
  GameState, 
  INITIAL_SPEED, 
  LANE_WIDTH, 
  LANES, 
  ObstacleData, 
  JUMP_FORCE, 
  GRAVITY,
  MAX_SPEED,
  SPEED_INCREMENT
} from './constants';
import { Player } from './components/Player';
import { Environment } from './components/Environment';
import { Obstacle } from './components/Obstacle';
import { playJumpSound, playCoinSound, playGemSound, playTokenSound, playHitSound } from './audio';
import { Trophy, Play, RotateCcw } from 'lucide-react';

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    status: GameStatus.START,
    score: 0,
    speed: INITIAL_SPEED,
    lane: 1, // Start in center
    playerY: 0,
    velocityY: 0,
    obstacles: [],
  });

  const lastSpawnRef = useRef(0);
  const gameLoopRef = useRef<number>(0);

  const startGame = () => {
    setGameState({
      status: GameStatus.PLAYING,
      score: 0,
      speed: INITIAL_SPEED,
      lane: 1,
      playerY: 0,
      velocityY: 0,
      obstacles: [],
    });
    lastSpawnRef.current = 0;
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (gameState.status !== GameStatus.PLAYING) return;

    if (e.key === 'ArrowLeft' || e.key === 'a') {
      setGameState(prev => ({ ...prev, lane: Math.max(0, prev.lane - 1) }));
    } else if (e.key === 'ArrowRight' || e.key === 'd') {
      setGameState(prev => ({ ...prev, lane: Math.min(2, prev.lane + 1) }));
    } else if ((e.key === 'ArrowUp' || e.key === ' ' || e.key === 'w') && gameState.playerY === 0) {
      setGameState(prev => ({ ...prev, velocityY: JUMP_FORCE }));
      playJumpSound();
    }
  }, [gameState.status, gameState.playerY]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Main Game Loop Logic (using requestAnimationFrame for physics)
  useEffect(() => {
    if (gameState.status !== GameStatus.PLAYING) return;

    let lastTime = performance.now();
    
    const loop = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      setGameState(prev => {
        // Physics update
        let newY = prev.playerY + prev.velocityY * delta;
        let newVelY = prev.velocityY - GRAVITY * delta;

        if (newY <= 0) {
          newY = 0;
          newVelY = 0;
        }

        // Speed update
        const newSpeed = Math.min(MAX_SPEED, prev.speed + SPEED_INCREMENT * delta);

        // Obstacles update
        const updatedObstacles = prev.obstacles
          .map(o => ({ ...o, z: o.z + newSpeed * delta }))
          .filter(o => o.z < 10); // Remove passed obstacles

        // Spawn logic
        lastSpawnRef.current += delta * newSpeed;
        if (lastSpawnRef.current > 15) {
          const lane = Math.floor(Math.random() * 3);
          const rand = Math.random();
          let type: ObstacleData['type'] = 'coin';

          if (rand > 0.8) {
            type = 'train';
          } else if (rand > 0.6) {
            type = 'barrier';
          } else if (rand > 0.45) {
            type = 'coin';
          } else if (rand > 0.35) {
            type = 'gem';
          } else if (rand > 0.3) {
            type = 'special_token';
          }

          updatedObstacles.push({
            id: Math.random().toString(),
            lane,
            z: -100,
            type,
          });
          lastSpawnRef.current = 0;
        }

        // Collision check
        let newScore = prev.score + delta * 10;
        let isGameOver = false;

        for (const o of updatedObstacles) {
          const dx = Math.abs(LANES[prev.lane] - LANES[o.lane]);
          const dz = Math.abs(o.z - 0);

          if (dx < 0.5 && dz < 1) {
            if (o.type === 'coin') {
              newScore += 50;
              playCoinSound();
              o.z = 100; 
            } else if (o.type === 'gem') {
              newScore += 200;
              playGemSound();
              o.z = 100;
            } else if (o.type === 'special_token') {
              newScore += 500;
              playTokenSound();
              o.z = 100;
            } else {
              // Check height
              const obstacleHeight = o.type === 'train' ? 2 : 0.8;
              if (newY < obstacleHeight) {
                isGameOver = true;
              }
            }
          }
        }

        if (isGameOver) {
          playHitSound();
          return { ...prev, status: GameStatus.GAMEOVER };
        }

        return {
          ...prev,
          playerY: newY,
          velocityY: newVelY,
          speed: newSpeed,
          score: newScore,
          obstacles: updatedObstacles.filter(o => o.z < 50), // Visual limit
        };
      });

      gameLoopRef.current = requestAnimationFrame(loop);
    };

    gameLoopRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(gameLoopRef.current);
  }, [gameState.status]);

  // Touch support
  const touchStartRef = useRef<{ x: number, y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || gameState.status !== GameStatus.PLAYING) return;

    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (Math.abs(dx) > 30) {
        if (dx > 0) {
          setGameState(prev => ({ ...prev, lane: Math.min(2, prev.lane + 1) }));
        } else {
          setGameState(prev => ({ ...prev, lane: Math.max(0, prev.lane - 1) }));
        }
      }
    } else {
      if (dy < -30 && gameState.playerY === 0) {
        setGameState(prev => ({ ...prev, velocityY: JUMP_FORCE }));
        playJumpSound();
      }
    }
    touchStartRef.current = null;
  };

  return (
    <div 
      className="w-full h-screen bg-transparent relative font-sans overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Sky Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-400 via-blue-300 to-yellow-100 opacity-60" />

      {/* Cityscape Silhouette */}
      <div className="absolute bottom-40 w-full h-32 flex items-end justify-between px-10 opacity-30 pointer-events-none">
        <div className="w-20 h-48 bg-slate-600 rounded-t-lg"></div>
        <div className="w-16 h-32 bg-slate-600 rounded-t-lg"></div>
        <div className="w-24 h-56 bg-slate-600 rounded-t-lg"></div>
        <div className="w-20 h-40 bg-slate-600 rounded-t-lg"></div>
        <div className="w-28 h-64 bg-slate-600 rounded-t-lg"></div>
        <div className="w-16 h-36 bg-slate-600 rounded-t-lg"></div>
      </div>

      {/* Side Special Offers */}
      <div className="absolute top-1/2 right-4 -translate-y-1/2 flex flex-col gap-4 pointer-events-none">
        <div className="w-20 h-20 bg-yellow-400 rounded-2xl border-4 border-white rotate-6 shadow-lg flex flex-col items-center justify-center pointer-events-auto cursor-pointer active:scale-95 transition-transform">
           <span className="text-[10px] font-black leading-none text-zinc-800">MEGA</span>
           <span className="text-xl font-black text-zinc-800">SALE</span>
        </div>
        <div className="w-20 h-20 bg-cyan-400 rounded-2xl border-4 border-white -rotate-3 shadow-lg flex items-center justify-center pointer-events-auto cursor-pointer active:scale-95 transition-transform">
           <div className="w-10 h-10 border-4 border-white rounded-full"></div>
        </div>
      </div>
      {/* 3D Game Canvas */}
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 4, 8]} fov={60} />
        <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
        
        <ambientLight intensity={0.5} />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={1.5} 
          castShadow 
          shadow-mapSize={[1024, 1024]}
        />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

        <Environment speed={gameState.speed} />
        
        <Player lane={gameState.lane} y={gameState.playerY} />

        {gameState.obstacles.map(o => (
          <Obstacle key={o.id} data={o} />
        ))}
      </Canvas>

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-8">
        <div className="w-full flex justify-between items-start">
          <div className="flex flex-col gap-2">
            <div className="bg-black/50 backdrop-blur-md px-6 py-4 rounded-2xl border-2 border-yellow-400">
              <p className="text-yellow-400 text-xs font-black uppercase tracking-widest">Score</p>
              <h2 className="text-white text-4xl font-black tabular-nums">{Math.floor(gameState.score).toString().padStart(7, '0')}</h2>
            </div>
            <div className="bg-black/50 backdrop-blur-md px-4 py-2 rounded-2xl border-2 border-cyan-400 w-fit">
              <p className="text-cyan-400 text-[10px] font-black uppercase">Multiplier</p>
              <h2 className="text-white text-xl font-black tabular-nums">x15</h2>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <div className="bg-black/50 backdrop-blur-md px-6 py-3 rounded-2xl border-2 border-white flex items-center gap-4">
              <div className="w-8 h-8 bg-yellow-400 rounded-full border-2 border-yellow-100 flex items-center justify-center font-bold text-yellow-800 text-xs">$</div>
              <h2 className="text-white text-3xl font-black tabular-nums">4,290</h2>
            </div>
            <div className="bg-red-500 rounded-full px-4 py-1 text-white text-[10px] font-bold uppercase shadow-lg">New High Score!</div>
          </div>
        </div>

        {/* Bottom Row elements from theme */}
        <div className="w-full flex justify-between items-end pointer-events-auto">
          <div className="flex gap-4">
            <button className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl border-4 border-white flex items-center justify-center shadow-xl hover:scale-105 transition-transform cursor-pointer">
              <div className="w-8 h-8 bg-white/30 rounded-full"></div>
            </button>
            <button className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl border-4 border-white flex items-center justify-center shadow-xl hover:scale-105 transition-transform cursor-pointer">
              <div className="w-8 h-8 bg-white/30 rounded-md rotate-45"></div>
            </button>
          </div>

          <motion.div 
            animate={{ x: [0, 5, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            className="bg-orange-500 rounded-full px-8 py-4 border-4 border-white shadow-2xl flex items-center gap-4"
          >
            <div className="w-12 h-6 bg-white/40 rounded-full animate-pulse"></div>
            <div className="text-white font-black text-xl uppercase italic">Hoverboard Ready</div>
          </motion.div>

          <div className="w-16 h-16" /> {/* Spacer */}
        </div>

        <AnimatePresence>
          {gameState.status === GameStatus.START && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="pointer-events-auto bg-white/10 backdrop-blur-xl p-12 rounded-[40px] border-4 border-white text-center max-w-md shadow-2xl"
            >
              <div className="w-24 h-24 bg-gradient-to-t from-pink-600 to-rose-400 rounded-full border-8 border-white mx-auto mb-6 flex items-center justify-center shadow-2xl">
                <Play className="text-white fill-white ml-2" size={40} />
              </div>
              <h1 className="text-white text-5xl font-black mb-4 tracking-tighter drop-shadow-lg uppercase">Urban Dash</h1>
              <p className="text-white mb-8 leading-relaxed font-bold">
                Dodge red metros, jump barriers, and collect golden coins!
              </p>
              
              <button 
                onClick={startGame}
                className="w-full bg-gradient-to-br from-green-500 to-teal-600 hover:from-green-400 hover:to-teal-500 text-white font-black py-5 rounded-3xl transition-all shadow-xl border-4 border-white active:scale-95 cursor-pointer uppercase tracking-widest text-lg"
              >
                Let's Run
              </button>
            </motion.div>
          )}

          {gameState.status === GameStatus.GAMEOVER && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="pointer-events-auto bg-pink-500 backdrop-blur-xl p-12 rounded-[40px] border-8 border-white text-center max-w-sm shadow-2xl"
            >
              <Trophy className="text-yellow-300 mx-auto mb-6 drop-shadow-md" size={80} />
              <h1 className="text-white text-4xl font-black mb-2 uppercase italic tracking-tighter">Crashed!</h1>
              <p className="text-white/90 mb-8 font-bold">You ran like a pro!</p>
              <div className="text-white text-7xl font-black mb-10 tracking-tighter drop-shadow-lg">
                {Math.floor(gameState.score)}
              </div>
              <button 
                onClick={startGame}
                className="w-full bg-white text-pink-600 font-black py-5 rounded-3xl transition-all hover:bg-pink-50 active:scale-95 cursor-pointer flex items-center justify-center gap-3 uppercase tracking-widest text-lg shadow-xl"
              >
                <RotateCcw size={24} />
                Run Again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Vignette Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-radial-gradient from-transparent to-black/40" />
    </div>
  );
}
