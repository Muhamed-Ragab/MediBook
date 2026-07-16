import type { TimeBlock } from "./types";

export const SLOT_DURATION_MINUTES = 30;

export const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const START_HOUR = 9;
export const END_HOUR = 17;

export function generateTimeBlocks(): TimeBlock[] {
  const blocks: TimeBlock[] = [];
  for (let h = START_HOUR; h < END_HOUR; h++) {
    blocks.push(`${h}:00`);
    blocks.push(`${h}:30`);
  }
  return blocks;
}

export const TIME_BLOCKS = generateTimeBlocks();
