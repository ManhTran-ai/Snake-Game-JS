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

const LEVELS = [
    {
        id: 1,
        name: "Classic Grassland",
        theme: "grassland",
        tickMs: 150,
        goalScore: 100,
        wrapAround: true,
        walls: [],
        portals: [],
        foodVariants: false,
        enemies: [],
        fogOfWar: false,
        shrinkInterval: 0,
        foodJumps: false,
        dynamicSpeed: null,
    },
    {
        id: 2,
        name: "Brick Dungeon",
        theme: "dungeon",
        tickMs: 120,
        goalScore: 150,
        wrapAround: false,
        walls: expandWalls(DUNGEON_WALLS),
        portals: [],
        foodVariants: false,
        enemies: [],
        fogOfWar: false,
        shrinkInterval: 0,
        foodJumps: false,
        dynamicSpeed: null,
    },
    {
        id: 3,
        name: "Portal & Mystery Fruit",
        theme: "portal",
        tickMs: 100,
        goalScore: 200,
        wrapAround: false,
        walls: [],
        portals: [
            { a: { x: 0,  y: 5  }, b: { x: 19, y: 15 } },
            { a: { x: 5,  y: 0  }, b: { x: 15, y: 19 } },
            { a: { x: 0,  y: 15 }, b: { x: 19, y: 5  } },
        ],
        foodVariants: true,
        enemies: [],
        fogOfWar: false,
        shrinkInterval: 0,
        foodJumps: false,
        dynamicSpeed: null,
    },
    {
        id: 4,
        name: "Haunted Patrol",
        theme: "haunted",
        tickMs: 90,
        goalScore: 250,
        wrapAround: false,
        walls: [],
        portals: [],
        foodVariants: false,
        enemies: [
            { path: "horizontal", x:  0, y:  5, dir:  1 },
            { path: "vertical",   x: 12, y:  0, dir:  1 },
            { path: "horizontal", x: 19, y: 15, dir: -1 },
        ],
        fogOfWar: true,
        fogRadius: 4,
        enemyPredictDistance: 2,
        shrinkInterval: 0,
        foodJumps: false,
        dynamicSpeed: null,
    },
    {
        id: 5,
        name: "Shrinking Matrix",
        theme: "matrix",
        tickMs: 80,
        goalScore: 300,
        wrapAround: false,
        walls: [],
        portals: [],
        foodVariants: false,
        enemies: [],
        fogOfWar: false,
        shrinkInterval: 20,
        arenaMinSize: 6,
        foodMaxLifetime: 15,
        dynamicSpeed: {
            start: 80,
            end: 50,
            step: 5,
            perScore: 50,
        },
    },
    {
        id: 6,
        name: "Shadow Hunt",
        theme: "shadow",
        tickMs: 75,
        goalScore: 400,
        wrapAround: false,
        walls: [],
        portals: [
            { a: { x: 0,  y: 3  }, b: { x: 19, y: 16 } },
            { a: { x: 3,  y: 19 }, b: { x: 16, y: 0  } },
        ],
        foodVariants: true,
        enemies: [
            { behavior: "chase", x: 10, y: 3,  dir: 1, path: "vertical" },
            { behavior: "chase", x:  5, y: 16, dir: -1, path: "vertical" },
            { path: "horizontal", x:  0, y: 9, dir:  1 },
        ],
        enemyPredictDistance: 0,
        maxHp: 3,
        hitInvulnMs: 1200,
        fogOfWar: true,
        fogRadius: 3,
        shrinkInterval: 12,
        arenaMinSize: 8,
        foodMaxLifetime: 12,
        dynamicSpeed: {
            start: 75,
            end: 45,
            step: 5,
            perScore: 40,
        },
    },
];