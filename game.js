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

const CELL_CLASS = {
    HEAD: "cell--head",
    BODY: "cell--body",
    TAIL: "cell--tail",
    FOOD: "cell--food",
    TONGUE_OUT: "tongue-out",
    WALL: "cell--wall",
    PORTAL: "cell--portal",
    ENEMY: "cell--enemy",
    ENEMY_WARNING: "cell--enemy-warning",
    FOG: "cell--fog",
    ARENA_WALL: "cell--arena-wall",
    INVULNERABLE: "cell--invulnerable",
    CHASE: "cell--enemy-chase",
};

function directionLabel(vec) {
    if (vec.x === 1) return "RIGHT";
    if (vec.x === -1) return "LEFT";
    if (vec.y === 1) return "DOWN";
    if (vec.y === -1) return "UP";
    return "RIGHT";
}

function loadHighScore() {
    try {
        const raw = localStorage.getItem(HIGH_SCORE_KEY);
        const n = parseInt(raw, 10);
        return Number.isFinite(n) && n > 0 ? n : 0;
    } catch (_) {
        return 0;
    }
}

function saveHighScore(value) {
    try {
        localStorage.setItem(HIGH_SCORE_KEY, String(value));
    } catch (_) {
    }
}

const SCROLL_KEYS = new Set([
    "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " ", "Spacebar",
]);

const KEY_TO_DIR = {
    ArrowUp:    DIRECTIONS.UP,
    w:          DIRECTIONS.UP,
    W:          DIRECTIONS.UP,
    ArrowDown:  DIRECTIONS.DOWN,
    s:          DIRECTIONS.DOWN,
    S:          DIRECTIONS.DOWN,
    ArrowLeft:  DIRECTIONS.LEFT,
    a:          DIRECTIONS.LEFT,
    A:          DIRECTIONS.LEFT,
    ArrowRight: DIRECTIONS.RIGHT,
    d:          DIRECTIONS.RIGHT,
    D:          DIRECTIONS.RIGHT,
};

function setupKeyboard(game) {
    window.addEventListener("keydown", (e) => {
        if (SCROLL_KEYS.has(e.key)) e.preventDefault();

        const key = e.key;
        if (key === " " || key === "Spacebar") {
            if (game.state === "menu") {
                return;
            }
            if (game.state === "idle" || game.state === "gameover" || game.state === "win") {
                game.start();
            } else if (game.state === "paused") {
                if (game.score === 0 && game.tickCount === 0) {
                    game.start();
                } else {
                    game.togglePause();
                }
            }
            return;
        }
        if (key === "p" || key === "P") {
            if (game.state === "running" || game.state === "paused") {
                game.togglePause();
            }
            return;
        }
        if (key === "r" || key === "R") {
            if (game.state === "menu") return;
            game.start();
            return;
        }

        if (key === "Escape") {
            if (game.state === "menu") return;
            game.backToMenu();
            return;
        }

        handleDirKey(game, key);
    });
}

const REVERSE_KEY_TO_DIR = {
    ArrowUp:    DIRECTIONS.DOWN,
    ArrowDown:  DIRECTIONS.UP,
    ArrowLeft:  DIRECTIONS.RIGHT,
    ArrowRight: DIRECTIONS.LEFT,
    w: DIRECTIONS.DOWN, W: DIRECTIONS.DOWN,
    s: DIRECTIONS.UP, S: DIRECTIONS.UP,
    a: DIRECTIONS.RIGHT, A: DIRECTIONS.RIGHT,
    d: DIRECTIONS.LEFT, D: DIRECTIONS.LEFT,
};

function handleDirKey(game, key) {
    const reversed = game.powerUps?.isReversed();
    const map = reversed ? REVERSE_KEY_TO_DIR : KEY_TO_DIR;
    const dir = map[key];
    if (dir && game.state === "running") {
        game.snake.queueDirection(dir);
    }
}

function setupTouchPad(game) {
    const buttons = document.querySelectorAll(".touch-btn");
    buttons.forEach((btn) => {
        btn.addEventListener("pointerdown", (e) => {
            e.preventDefault();
            const action = btn.dataset.action;
            if (action === "PAUSE") {
                if (game.state === "running" || game.state === "paused") {
                    game.togglePause();
                } else if (game.state === "idle" || game.state === "gameover") {
                    game.start();
                }
                return;
            }
            const dir = btn.dataset.direction;
            if (dir && game.state === "running") {
                game.snake.queueDirection(DIRECTIONS[dir]);
            }
        });
    });
}