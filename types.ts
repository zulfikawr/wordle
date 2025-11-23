export enum LetterState {
  INITIAL = 'initial',
  CORRECT = 'correct', // Green
  PRESENT = 'present', // Yellow
  ABSENT = 'absent',   // Gray
}

export interface TileData {
  char: string;
  state: LetterState;
}

export type GridData = TileData[][];

export enum GameStatus {
  LOADING = 'loading',
  PLAYING = 'playing',
  VALIDATING = 'validating',
  WON = 'won',
  LOST = 'lost',
}

export interface GameSettings {
  wordLength: number;
}
