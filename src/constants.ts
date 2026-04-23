/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum GameStatus {
  START = 'START',
  PLAYING = 'PLAYING',
  GAMEOVER = 'GAMEOVER',
}

export const LANES = [-2, 0, 2];
export const LANE_WIDTH = 2;
export const INITIAL_SPEED = 10;
export const SPEED_INCREMENT = 0.5;
export const MAX_SPEED = 30;
export const JUMP_FORCE = 12;
export const GRAVITY = 30;

export interface ObstacleData {
  id: string;
  lane: number;
  z: number;
  type: 'barrier' | 'train' | 'coin' | 'gem' | 'special_token';
}

export interface GameState {
  status: GameStatus;
  score: number;
  speed: number;
  lane: number; // 0, 1, 2
  playerY: number;
  velocityY: number;
  obstacles: ObstacleData[];
}
