const GRID_SIZE = 20;
const INITIAL_LENGTH = 4;
const HIGH_SCORE_KEY = "neon-snake.highscore";

const DEFAULT_TICK_MS = 90;

const DIRECTIONS = {
    UP:    { x:  0, y: -1 },
    DOWN:  { x:  0, y:  1 },
    LEFT:  { x: -1, y:  0 },
    RIGHT: { x:  1, y:  0 },
};

const DUNGEON_WALLS = [
    { x: 5,  y: 3,  length: 4, dir: "h" },
    { x: 12, y: 8,  length: 5, dir: "h" },
    { x: 8,  y: 13, length: 6, dir: "h" },
    { x: 3,  y: 16, length: 4, dir: "v" },
    { x: 15, y: 5,  length: 5, dir: "v" },
];

function expandWalls(defs) {
    const seen = new Set();
    const cells = [];
    for (const w of defs) {
        for (let i = 0; i < w.length; i++) {
            const c = w.dir === "h"
                ? { x: w.x + i, y: w.y }
                : { x: w.x, y: w.y + i };
            const key = `${c.x},${c.y}`;
            if (!seen.has(key)) {
                seen.add(key);
                cells.push(c);
            }
        }
    }
    return cells;
}