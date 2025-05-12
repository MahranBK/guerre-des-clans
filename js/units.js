// Unit types and their base stats
const UNIT_TYPES = {
    WARRIOR: {
        type: 'warrior',
        symbol: '⚔️',
        hp: 100,
        attack: 30,
        defense: 20,
        attackRange: 1,
        moveRange: 1
    },
    ARCHER: {
        type: 'archer',
        symbol: '🏹',
        hp: 80,
        attack: 25,
        defense: 15,
        attackRange: 2,
        moveRange: 1
    },
    MAGE: {
        type: 'mage',
        symbol: '🔮',
        hp: 70,
        attack: 35,
        defense: 10,
        attackRange: 3,
        moveRange: 1
    }
};

// Clan configurations
const CLAN_CONFIGS = {
    mountain: {
        name: 'Mountain Clan',
        warriors: 3,
        archers: 2,
        mages: 1
    },
    plains: {
        name: 'Plains Clan',
        warriors: 2,
        archers: 3,
        mages: 1
    },
    wise: {
        name: 'Wise Clan',
        warriors: 1,
        archers: 2,
        mages: 3
    }
};

class Unit {
    constructor(type, owner) {
        const baseStats = UNIT_TYPES[type.toUpperCase()];
        this.id = `${owner}-${type}-${Math.random().toString(36).substr(2, 9)}`;
        this.type = type;
        this.owner = owner;
        this.hp = baseStats.hp;
        this.maxHp = baseStats.hp;
        this.attack = baseStats.attack;
        this.defense = baseStats.defense;
        this.baseDefense = baseStats.defense; // Store base defense value
        this.attackRange = baseStats.attackRange;
        this.moveRange = baseStats.moveRange;
        this.symbol = baseStats.symbol;
        this.position = null;
        this.hasMoved = false;
        this.hasActed = false;
        this.temporaryDefense = false;
    }

    takeDamage(amount) {
        // Apply defense bonus if unit is defending
        if (this.temporaryDefense && window.defenseManager) {
            const bonus = window.defenseManager.getDefenseBonus(this);
            amount = Math.max(1, amount - bonus); // Ensure at least 1 damage
        }
        
        this.hp = Math.max(0, this.hp - amount);
        return this.hp <= 0;
    }

    heal(amount) {
        this.hp = Math.min(this.maxHp, this.hp + amount);
    }

    resetTurn() {
        this.hasMoved = false;
        this.hasActed = false;
    }

    getDisplayInfo() {
        return {
            type: this.type,
            hp: `${this.hp}/${this.maxHp}`,
            attack: this.attack,
            defense: this.temporaryDefense ? `${this.defense} (+${this.defense - this.baseDefense})` : this.defense,
            position: `(${this.position.row}, ${this.position.col})`,
            symbol: this.symbol,
            owner: this.owner
        };
    }
}

class UnitManager {
    constructor() {
        this.units = {
            player1: [],
            player2: []
        };
        this.loadClans();
        this.generateUnits();
        this.displayUnitsInPanels();
    }

    loadClans() {
        this.player1Clan = localStorage.getItem('player1Clan') || 'mountain';
        this.player2Clan = localStorage.getItem('player2Clan') || 'mountain';
        
        // Display clan names
        document.getElementById('player1-clan-name').textContent = CLAN_CONFIGS[this.player1Clan].name;
        document.getElementById('player2-clan-name').textContent = CLAN_CONFIGS[this.player2Clan].name;
    }

    generateUnits() {
        // Generate units for player 1
        this.generateClanUnits('player1', this.player1Clan);
        // Generate units for player 2
        this.generateClanUnits('player2', this.player2Clan);
    }

    generateClanUnits(player, clanType) {
        const config = CLAN_CONFIGS[clanType];
        
        // Create warriors
        for (let i = 0; i < config.warriors; i++) {
            this.units[player].push(new Unit('warrior', player));
        }
        
        // Create archers
        for (let i = 0; i < config.archers; i++) {
            this.units[player].push(new Unit('archer', player));
        }
        
        // Create mages
        for (let i = 0; i < config.mages; i++) {
            this.units[player].push(new Unit('mage', player));
        }
    }

    displayUnitsInPanels() {
        // Display units in player 1 panel
        const player1Panel = document.getElementById('player1-units');
        player1Panel.innerHTML = this.createUnitDisplay(this.units.player1);

        // Display units in player 2 panel
        const player2Panel = document.getElementById('player2-units');
        player2Panel.innerHTML = this.createUnitDisplay(this.units.player2);
    }

    createUnitDisplay(units) {
        return units.map(unit => `
            <div class="unit-display ${unit.owner}" data-unit-id="${unit.id}">
                <div class="unit-symbol">${unit.symbol}</div>
                <div class="unit-info">
                    <div class="unit-type">${unit.type}</div>
                    <div class="unit-hp">HP: ${unit.hp}/${unit.maxHp}</div>
                </div>
            </div>
        `).join('');
    }

    getUnitById(unitId) {
        return [...this.units.player1, ...this.units.player2].find(unit => unit.id === unitId);
    }

    getUnitAtPosition(position) {
        return [...this.units.player1, ...this.units.player2].find(unit => 
            unit.position && unit.position.row === position.row && unit.position.col === position.col
        );
    }

    removeUnit(unitId) {
        ['player1', 'player2'].forEach(player => {
            this.units[player] = this.units[player].filter(unit => unit.id !== unitId);
        });
        this.displayUnitsInPanels();
    }
}

// Initialize units when the document is ready
document.addEventListener('DOMContentLoaded', () => {
    window.unitManager = new UnitManager();
}); 