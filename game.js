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

class Snake {
    constructor(gridSize, startLength) {
        this.gridSize = gridSize;
        this.wrapAround = false;
        this.walls = [];
        this.portalManager = null;
        this.arena = null;
        this.reset(startLength);
    }

    reset(startLength) {
        const mid = Math.floor(this.gridSize / 2);
        this.segments = [];
        for (let i = 0; i < startLength; i++) {
            this.segments.push({ x: mid - i, y: mid });
        }
        this.direction = DIRECTIONS.RIGHT;
        this.pendingDirections = [];
        this.isProcessingInput = false;
        this.justAte = false;
        this.poppedTail = null;
    }

    queueDirection(next) {
        const current =
            this.pendingDirections[this.pendingDirections.length - 1] ||
            this.direction;

        if (current.x + next.x === 0 && current.y + next.y === 0) return;
        if (current.x === next.x && current.y === next.y) return;

        if (this.pendingDirections.length >= 2) {
            this.pendingDirections.shift();
        }
        this.pendingDirections.push(next);
    }

    _nextHead() {
        const head = this.segments[0];
        let newHead = {
            x: head.x + this.direction.x,
            y: head.y + this.direction.y,
        };

        if (this.wrapAround) {
            newHead.x = (newHead.x + this.gridSize) % this.gridSize;
            newHead.y = (newHead.y + this.gridSize) % this.gridSize;
        }

        if (this.portalManager) {
            const exit = this.portalManager.teleport(newHead.x, newHead.y);
            if (exit) newHead = exit;
        }

        return newHead;
    }

    advance() {
        if (this.pendingDirections.length > 0 && !this.isProcessingInput) {
            this.isProcessingInput = true;
            this.direction = this.pendingDirections.shift();
        }
        this.isProcessingInput = false;

        const newHead = this._nextHead();
        this.segments.unshift(newHead);

        if (this.justAte) {
            this.justAte = false;
            this.poppedTail = null;
        } else {
            this.poppedTail = this.segments.pop();
        }
        return newHead;
    }

    eat(points = 10) {
        this.justAte = true;
        return points;
    }

    revertAdvance() {
        this.segments.shift();
        if (this.poppedTail) {
            this.segments.push(this.poppedTail);
            this.poppedTail = null;
        }
    }

    checkCollision(nextHead) {
        if (!this.wrapAround) {
            if (
                nextHead.x < 0 ||
                nextHead.y < 0 ||
                nextHead.x >= this.gridSize ||
                nextHead.y >= this.gridSize
            ) {
                return true;
            }
        }

        if (this.arena && !this.arena.isInBounds(nextHead.x, nextHead.y)) {
            return true;
        }

        if (this.walls && this.walls.length) {
            for (const wall of this.walls) {
                if (wall.x === nextHead.x && wall.y === nextHead.y) return true;
            }
        }

        for (let i = 1; i < this.segments.length; i++) {
            const seg = this.segments[i];
            if (seg.x === nextHead.x && seg.y === nextHead.y) return true;
        }
        return false;
    }

    checkCollisionWithEnemies(enemyManager) {
        if (!enemyManager || !enemyManager.enemies.length) return false;
        const head = this.segments[0];
        if (!head) return false;
        for (const e of enemyManager.enemies) {
            if (e.position.x === head.x && e.position.y === head.y) return true;
        }
        return false;
    }

    occupies(x, y) {
        return this.segments.some((s) => s.x === x && s.y === y);
    }
}

const FOOD_TYPES = {
    NORMAL:  { id: "NORMAL",  score: 10, cssClass: "cell--food",          emoji: "🍎" },
    REVERSE: { id: "REVERSE", score: 25, cssClass: "cell--food-reverse", emoji: "🌀" },
    SPEED:   { id: "SPEED",   score: 20, cssClass: "cell--food-speed",    emoji: "⚡" },
};

const VARIANT_PROBABILITY = {
    REVERSE: 0.1,
    SPEED:   0.1,
};

class Food {
    constructor(gridSize) {
        this.gridSize = gridSize;
        this.position = { x: 0, y: 0 };
        this.type = FOOD_TYPES.NORMAL;

        this.tickSinceSpawn = 0;
        this.maxLifetime = 0;
    }

    respawn(snake, walls = [], variants = false, portals = []) {
        const free = [];
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                if (snake.occupies(x, y)) continue;
                if (walls.some((w) => w.x === x && w.y === y)) continue;
                if (portals.some((p) =>
                    (p.a.x === x && p.a.y === y) ||
                    (p.b.x === x && p.b.y === y)
                )) continue;
                free.push({ x, y });
            }
        }
        if (free.length === 0) {
            this.position = null;
            return false;
        }
        this.position = free[Math.floor(Math.random() * free.length)];

        if (variants) {
            const r = Math.random();
            if (r < VARIANT_PROBABILITY.REVERSE) {
                this.type = FOOD_TYPES.REVERSE;
            } else if (r < VARIANT_PROBABILITY.REVERSE + VARIANT_PROBABILITY.SPEED) {
                this.type = FOOD_TYPES.SPEED;
            } else {
                this.type = FOOD_TYPES.NORMAL;
            }
        } else {
            this.type = FOOD_TYPES.NORMAL;
        }

        this.tickSinceSpawn = 0;
        return true;
    }

    tick(snake, walls, variants = false, portals = []) {
        if (this.maxLifetime <= 0) return false;
        this.tickSinceSpawn++;
        if (this.tickSinceSpawn >= this.maxLifetime) {
            this.respawn(snake, walls, variants, portals);
            return true;
        }
        return false;
    }
}

class PortalManager {
    constructor(portals = []) {
        this.portals = portals;
    }

    teleport(x, y) {
        for (const p of this.portals) {
            if (p.a.x === x && p.a.y === y) return { x: p.b.x, y: p.b.y };
            if (p.b.x === x && p.b.y === y) return { x: p.a.x, y: p.a.y };
        }
        return null;
    }

    isPortal(x, y) {
        return this.portals.some(
            (p) =>
                (p.a.x === x && p.a.y === y) ||
                (p.b.x === x && p.b.y === y)
        );
    }

    get count() {
        return this.portals.length;
    }
}

const POWERUP_DURATION_MS = 5000;

class PowerUpManager {
    constructor() {
        this.effects = {
            reversed: 0,
            speed: 0,
        };
    }

    reset() {
        this.effects.reversed = 0;
        this.effects.speed = 0;
    }

    update(deltaMs) {
        if (this.effects.reversed > 0) {
            this.effects.reversed = Math.max(0, this.effects.reversed - deltaMs);
        }
        if (this.effects.speed > 0) {
            this.effects.speed = Math.max(0, this.effects.speed - deltaMs);
        }
    }

    activateReverse() {
        this.effects.reversed = POWERUP_DURATION_MS;
    }

    activateSpeed() {
        this.effects.speed = POWERUP_DURATION_MS;
    }

    isReversed() {
        return this.effects.reversed > 0;
    }

    isSpeedUp() {
        return this.effects.speed > 0;
    }

    speedMultiplier() {
        return this.isSpeedUp() ? 0.5 : 1.0;
    }

    reversedRemainingSecs() {
        return Math.ceil(this.effects.reversed / 1000);
    }

    speedRemainingSecs() {
        return Math.ceil(this.effects.speed / 1000);
    }
}