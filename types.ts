export type Player = 'X' | 'O';
export type SquareValue = Player | null;

export enum GameMode {
  MENU = 'MENU',
  LOCAL = 'LOCAL',
  AI = 'AI',
  BLUETOOTH = 'BLUETOOTH'
}

export interface BluetoothDeviceState {
  isConnected: boolean;
  deviceName: string | null;
  error: string | null;
}

export interface GameState {
  squares: SquareValue[];
  xIsNext: boolean;
  winner: Player | 'DRAW' | null;
  winningLine: number[] | null;
}