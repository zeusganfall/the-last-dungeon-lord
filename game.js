const CONFIG = {
    gridSize: 20,
    mapWidth: 20,
    mapHeight: 15,
    viewRadius: 6
};

const TILE_TYPES = {
    WALL: 0,
    FLOOR: 1,
    EXIT: 2,
    GOLD: 3,
    TRAP: 4
};

const EVENTS = [
    {
        title: "Treasure Found",
        description: "You stumble upon a dusty chest hidden under some debris.",
        choices: [
            { text: "Open it carefully", effect: { gold: 20, reputation: 1 }, log: "You found 20 gold and gained some fame." },
            { text: "Smash it open", effect: { gold: 15, dungeonPower: 2 }, log: "The noise echoes through the halls, increasing dungeon power." },
            { text: "Leave it alone", effect: { fear: -5 }, log: "You stay cautious and feel less afraid." }
        ]
    },
    {
        title: "Trapped Corridor",
        description: "The floorboards creak suspiciously beneath your feet.",
        choices: [
            { text: "Check for wires", effect: { hp: -5, reputation: 2 }, log: "You avoid the worst but get a small scratch. Your skill is noted." },
            { text: "Run through quickly", effect: { hp: -15, fear: 10 }, log: "You trigger the trap! It hurts, and your heart is racing." },
            { text: "Wait and listen", effect: { dungeonPower: -1, fear: 5 }, log: "You avoid the trap and quiet the dungeon slightly." }
        ]
    },
    {
        title: "Wandering Spirit",
        description: "A translucent figure floats before you, whispering forgotten secrets.",
        choices: [
            { text: "Listen to the secrets", effect: { fear: 15, reputation: 5 }, log: "The secrets are terrifying but valuable for your reputation." },
            { text: "Offer a prayer", effect: { hp: 10, fear: -10 }, log: "The spirit blesses you before vanishing. You feel refreshed." },
            { text: "Drive it away", effect: { dungeonPower: 5 }, log: "Your aggression fuels the dungeon's dark energy." }
        ]
    },
    {
        title: "Weak Enemy Encounter",
        description: "A lone, starving goblin lunges at you from the shadows!",
        choices: [
            { text: "Fight it off", effect: { hp: -10, reputation: 3 }, log: "You defeat the goblin but take a few hits." },
            { text: "Intimidate it", effect: { fear: 5, reputation: -2, dungeonPower: 5 }, log: "The goblin flees, but you feel the dungeon growing stronger." },
            { text: "Bribe it", effect: { gold: -5, fear: -5 }, log: "The goblin takes your gold and leaves you in peace." }
        ]
    },
    {
        title: "Dark Shrine",
        description: "An ancient altar pulses with a faint, malevolent purple light.",
        choices: [
            { text: "Make a sacrifice", effect: { hp: -20, dungeonPower: 10 }, log: "You offer your blood. The dungeon trembles with new power." },
            { text: "Desecrate the altar", effect: { reputation: 10, fear: 20 }, log: "You destroy the shrine. You feel heroic but marked by evil." },
            { text: "Observe from afar", effect: { fear: 5, dungeonPower: 2 }, log: "The shrine's energy seeps into the surroundings." }
        ]
    },
    {
        title: "Atmospheric Room",
        description: "The air here is thick with the scent of damp stone and old bones. It's eerily quiet.",
        choices: [
            { text: "Rest for a moment", effect: { hp: 5, fear: -5 }, log: "A brief moment of peace in the dark." },
            { text: "Search the walls", effect: { reputation: 1 }, log: "You find some ancient carvings and learn about the dungeon." }
        ]
    }
];

class Game {
    constructor() {
        this.state = {
            hp: 100,
            gold: 0,
            fear: 0,
            reputation: 0,
            dungeonPower: 0,
            depth: 1,
            playerPos: { x: 0, y: 0 },
            map: [],
            visibility: [], // 0: hidden, 1: discovered, 2: visible
            visited: [], // tracking tiles visited for events
            screen: 'title'
        };

        this.init();
    }

    init() {
        document.getElementById('start-button').addEventListener('click', () => this.startGame());
        window.addEventListener('keydown', (e) => this.handleInput(e));
    }

    startGame() {
        this.state.screen = 'game';
        document.getElementById('title-screen').classList.add('hidden');
        document.getElementById('game-screen').classList.remove('hidden');
        this.generateLevel();
        this.render();
    }

    generateLevel() {
        const { mapWidth, mapHeight } = CONFIG;
        this.state.map = Array(mapHeight).fill(null).map(() => Array(mapWidth).fill(TILE_TYPES.WALL));
        this.state.visibility = Array(mapHeight).fill(null).map(() => Array(mapWidth).fill(0));
        this.state.visited = Array(mapHeight).fill(null).map(() => Array(mapWidth).fill(false));

        // Simple random room generation or just a carver
        this.carveDungeon();
        this.placePlayer();

        // Mark starting position as visited
        this.state.visited[this.state.playerPos.y][this.state.playerPos.x] = true;

        this.placeItems();
        this.updateVisibility();
    }

    carveDungeon() {
        // Very basic random walk carving for now
        let x = Math.floor(CONFIG.mapWidth / 2);
        let y = Math.floor(CONFIG.mapHeight / 2);
        let steps = 0;
        const maxSteps = (CONFIG.mapWidth * CONFIG.mapHeight) * 0.4;

        while (steps < maxSteps) {
            if (this.state.map[y][x] === TILE_TYPES.WALL) {
                this.state.map[y][x] = TILE_TYPES.FLOOR;
                steps++;
            }
            const dir = Math.floor(Math.random() * 4);
            if (dir === 0 && x > 1) x--;
            else if (dir === 1 && x < CONFIG.mapWidth - 2) x++;
            else if (dir === 2 && y > 1) y--;
            else if (dir === 3 && y < CONFIG.mapHeight - 2) y++;
        }
    }

    placePlayer() {
        let x, y;
        do {
            x = Math.floor(Math.random() * CONFIG.mapWidth);
            y = Math.floor(Math.random() * CONFIG.mapHeight);
        } while (this.state.map[y][x] !== TILE_TYPES.FLOOR);
        this.state.playerPos = { x, y };
    }

    placeItems() {
        // Place exit
        let x, y;
        do {
            x = Math.floor(Math.random() * CONFIG.mapWidth);
            y = Math.floor(Math.random() * CONFIG.mapHeight);
        } while (this.state.map[y][x] !== TILE_TYPES.FLOOR || (x === this.state.playerPos.x && y === this.state.playerPos.y));
        this.state.map[y][x] = TILE_TYPES.EXIT;

        // Place gold
        for (let i = 0; i < 8; i++) {
            do {
                x = Math.floor(Math.random() * CONFIG.mapWidth);
                y = Math.floor(Math.random() * CONFIG.mapHeight);
            } while (this.state.map[y][x] !== TILE_TYPES.FLOOR);
            this.state.map[y][x] = TILE_TYPES.GOLD;
        }

        // Place traps
        for (let i = 0; i < 5; i++) {
            do {
                x = Math.floor(Math.random() * CONFIG.mapWidth);
                y = Math.floor(Math.random() * CONFIG.mapHeight);
            } while (this.state.map[y][x] !== TILE_TYPES.FLOOR || (x === this.state.playerPos.x && y === this.state.playerPos.y));
            this.state.map[y][x] = TILE_TYPES.TRAP;
        }
    }

    handleInput(e) {
        if (this.state.screen !== 'game' && this.state.screen !== 'event') return;
        if (this.state.screen === 'event') return; // Block input during events

        let dx = 0, dy = 0;
        if (e.key === 'ArrowUp' || e.key === 'w') dy = -1;
        else if (e.key === 'ArrowDown' || e.key === 's') dy = 1;
        else if (e.key === 'ArrowLeft' || e.key === 'a') dx = -1;
        else if (e.key === 'ArrowRight' || e.key === 'd') dx = 1;

        if (dx !== 0 || dy !== 0) {
            this.movePlayer(dx, dy);
        }
    }

    movePlayer(dx, dy) {
        const nextX = this.state.playerPos.x + dx;
        const nextY = this.state.playerPos.y + dy;

        if (nextX >= 0 && nextX < CONFIG.mapWidth && nextY >= 0 && nextY < CONFIG.mapHeight) {
            const tile = this.state.map[nextY][nextX];
            if (tile !== TILE_TYPES.WALL) {
                this.state.playerPos = { x: nextX, y: nextY };

                // Event system check: trigger on new tiles (floor, gold, or trap)
                const triggerableTiles = [TILE_TYPES.FLOOR, TILE_TYPES.GOLD, TILE_TYPES.TRAP];
                if (triggerableTiles.includes(tile) && !this.state.visited[nextY][nextX]) {
                    this.state.visited[nextY][nextX] = true;
                    const randomEvent = EVENTS[Math.floor(Math.random() * EVENTS.length)];
                    this.showEvent(randomEvent);
                }

                this.handleTileInteraction(tile, nextX, nextY);
                this.updateVisibility();
                this.render();
            }
        }
    }

    handleTileInteraction(tile, x, y) {
        if (tile === TILE_TYPES.GOLD) {
            this.state.gold += 10;
            this.state.map[y][x] = TILE_TYPES.FLOOR;
            this.log('Picked up 10 gold!');
        } else if (tile === TILE_TYPES.TRAP) {
            const damage = 10 + Math.floor(Math.random() * 10);
            this.state.hp -= damage;
            this.state.map[y][x] = TILE_TYPES.FLOOR;
            this.log(`Ouch! Stepped on a trap. Lost ${damage} HP.`);
            this.checkGameOver();
        } else if (tile === TILE_TYPES.EXIT) {
            this.state.depth++;
            this.state.hp = Math.min(100, this.state.hp + 20); // Heal a bit
            this.log(`Descended to depth ${this.state.depth}. Healed 20 HP.`);
            this.generateLevel();
        }
    }

    checkGameOver() {
        if (this.state.hp <= 0) {
            this.state.hp = 0;
            this.log('GAME OVER. You died in the dungeon.');
            this.state.screen = 'title';
            setTimeout(() => {
                alert(`Game Over! Depth reached: ${this.state.depth}, Gold collected: ${this.state.gold}`);
                location.reload();
            }, 100);
        }
    }

    updateVisibility() {
        // Reset current visibility to 'discovered' if it was 'visible'
        for (let y = 0; y < CONFIG.mapHeight; y++) {
            for (let x = 0; x < CONFIG.mapWidth; x++) {
                if (this.state.visibility[y][x] === 2) {
                    this.state.visibility[y][x] = 1;
                }
            }
        }

        const px = this.state.playerPos.x;
        const py = this.state.playerPos.y;
        const radius = CONFIG.viewRadius;

        for (let y = py - radius; y <= py + radius; y++) {
            for (let x = px - radius; x <= px + radius; x++) {
                if (x >= 0 && x < CONFIG.mapWidth && y >= 0 && y < CONFIG.mapHeight) {
                    const dist = Math.sqrt((x - px) ** 2 + (y - py) ** 2);
                    if (dist <= radius) {
                        this.state.visibility[y][x] = 2;
                    }
                }
            }
        }
    }

    showEvent(event) {
        this.state.screen = 'event';
        const modal = document.getElementById('event-modal');
        const title = document.getElementById('event-title');
        const desc = document.getElementById('event-description');
        const choicesContainer = document.getElementById('event-choices');

        title.textContent = event.title;
        desc.textContent = event.description;
        choicesContainer.innerHTML = '';

        event.choices.forEach(choice => {
            const btn = document.createElement('button');
            btn.className = 'choice-button';
            btn.textContent = choice.text;
            btn.onclick = () => this.handleChoice(choice);
            choicesContainer.appendChild(btn);
        });

        modal.classList.remove('hidden');
    }

    handleChoice(choice) {
        // Apply effects
        if (choice.effect) {
            if (choice.effect.hp) this.state.hp += choice.effect.hp;
            if (choice.effect.gold) this.state.gold += choice.effect.gold;
            if (choice.effect.fear) this.state.fear += choice.effect.fear;
            if (choice.effect.reputation) this.state.reputation += choice.effect.reputation;
            if (choice.effect.dungeonPower) this.state.dungeonPower += choice.effect.dungeonPower;

            // Clamp stats
            this.state.hp = Math.max(0, Math.min(100, this.state.hp));
            this.state.fear = Math.max(0, this.state.fear);
        }

        if (choice.log) {
            this.log(choice.log);
        }

        // Close modal
        document.getElementById('event-modal').classList.add('hidden');
        this.state.screen = 'game';
        this.render();
        this.checkGameOver();
    }

    log(msg) {
        const log = document.getElementById('message-log');
        const entry = document.createElement('div');
        entry.textContent = msg;
        log.appendChild(entry);
        log.scrollTop = log.scrollHeight;
    }

    render() {
        // Update UI
        document.getElementById('hp-value').textContent = this.state.hp;
        document.getElementById('gold-value').textContent = this.state.gold;
        document.getElementById('fear-value').textContent = this.state.fear;
        document.getElementById('rep-value').textContent = this.state.reputation;
        document.getElementById('power-value').textContent = this.state.dungeonPower;
        document.getElementById('depth-value').textContent = this.state.depth;

        const container = document.getElementById('dungeon-container');
        container.innerHTML = '';
        container.style.gridTemplateColumns = `repeat(${CONFIG.mapWidth}, 1fr)`;
        container.style.gridTemplateRows = `repeat(${CONFIG.mapHeight}, 1fr)`;

        for (let y = 0; y < CONFIG.mapHeight; y++) {
            for (let x = 0; x < CONFIG.mapWidth; x++) {
                const tileDiv = document.createElement('div');
                tileDiv.className = 'tile';

                const vis = this.state.visibility[y][x];
                if (vis === 0) {
                    tileDiv.classList.add('fog');
                } else {
                    const type = this.state.map[y][x];
                    if (type === TILE_TYPES.WALL) tileDiv.classList.add('wall');
                    else if (type === TILE_TYPES.FLOOR) tileDiv.classList.add('floor');
                    else if (type === TILE_TYPES.EXIT) tileDiv.classList.add('exit');
                    else if (type === TILE_TYPES.GOLD) tileDiv.classList.add('gold');
                    else if (type === TILE_TYPES.TRAP) tileDiv.classList.add('trap');

                    if (vis === 1) {
                        tileDiv.classList.add('discovered');
                    }
                }

                if (x === this.state.playerPos.x && y === this.state.playerPos.y) {
                    const playerDiv = document.createElement('div');
                    playerDiv.className = 'tile player';
                    tileDiv.appendChild(playerDiv);
                }

                container.appendChild(tileDiv);
            }
        }
    }
}

new Game();
