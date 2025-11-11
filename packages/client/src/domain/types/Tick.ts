export interface Tick {
  frame: number;
  time: number; // epoch ms
  dt: number;   // delta milliseconds
}
