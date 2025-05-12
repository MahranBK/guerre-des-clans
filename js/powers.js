class PowerManager {
    constructor() {
        // Power configurations
        this.powers = {
            warrior: [{
                name: 'Contre-Attaque',
                description: 'Si attaqué au prochain tour, renvoie une partie des dégâts à l\'attaquant.',
                range: 0,
                cooldown: 1,
                riposteMultiplier: 0.5 // 50% damage return
            }],
            archer: [{
                name: 'Tir Précis',
                description: 'Prochain tir ignore 50% de la défense ennemie et touche plus facilement.',
                range: 0,
                cooldown: 1,
                defenseIgnore: 0.5,
                hitBonus: 1 // Reduces hit threshold by 1
            }],
            mage: [{
                name: 'Explosion de Feu',
                description: 'Inflige des dégâts aux ennemis dans une zone 3x3.',
                range: 2,
                cooldown: 1,
                aoeRange: 1, // 3x3 grid (1 cell in each direction)
                aoeDamage: 15
            }]
        };

        // Track power states
        this.activeEffects = new Map(); // Map<unitId, {effectType, duration, params}>
        this.cooldowns = new Map(); // Map<unitId_powerName, turnsRemaining>
    }

    /**
     * Start power selection for a unit
     * @param {Unit} unit - The unit using the power
     * @returns {boolean} Whether power selection can start
     */
    startPowerSelection(unit) {
        if (unit.hasActed) {
            window.turnManager.logGameEvent('⚠️ Cette unité a déjà agi ce tour');
            return false;
        }

        const availablePowers = this.powers[unit.type.toLowerCase()];
        if (!availablePowers || availablePowers.length === 0) {
            window.turnManager.logGameEvent('⚠️ Cette unité n\'a pas de pouvoir disponible');
            return false;
        }

        // Check cooldowns
        const power = availablePowers[0]; // Currently one power per type
        const cooldownKey = `${unit.id}_${power.name}`;
        if (this.cooldowns.get(cooldownKey) > 0) {
            window.turnManager.logGameEvent(`⚠️ ${power.name} est encore en recharge`);
            return false;
        }

        return true;
    }

    /**
     * Use a power on a target
     * @param {Unit} unit - The unit using the power
     * @param {string} powerName - Name of the power to use
     * @param {Object} targetPosition - {row, col} of target
     * @returns {boolean} Whether the power was used successfully
     */
    usePower(unit, powerName, targetPosition) {
        const power = this.powers[unit.type.toLowerCase()][0];
        if (!power || power.name !== powerName) return false;

        switch (unit.type.toLowerCase()) {
            case 'warrior':
                return this.activateContrAttaque(unit, power);
            case 'archer':
                return this.activateTirPrecis(unit, power);
            case 'mage':
                return this.activateExplosionDeFeu(unit, power, targetPosition);
            default:
                return false;
        }
    }

    /**
     * Activate Contre-Attaque power
     * @param {Unit} unit - The warrior unit
     * @param {Object} power - Power configuration
     */
    activateContrAttaque(unit, power) {
        // Set up riposte effect
        this.activeEffects.set(unit.id, {
            effectType: 'riposte',
            duration: 2, // Current turn + enemy turn
            params: {
                multiplier: power.riposteMultiplier
            }
        });

        // Add visual effect
        const cell = document.getElementById(`cell-${unit.position.row}-${unit.position.col}`);
        const unitElement = cell.querySelector('.unit');
        unitElement.classList.add('power-active', 'riposte');

        // Set cooldown
        this.setCooldown(unit, power);

        // Mark unit as acted
        unit.hasActed = true;
        
        // Log activation
        window.turnManager.logGameEvent(`⚔️ ${unit.type} active Contre-Attaque!`, 'power');
        return true;
    }

    /**
     * Activate Tir Précis power
     * @param {Unit} unit - The archer unit
     * @param {Object} power - Power configuration
     */
    activateTirPrecis(unit, power) {
        // Set up precision shot effect
        this.activeEffects.set(unit.id, {
            effectType: 'precision',
            duration: 1, // Until next attack
            params: {
                defenseIgnore: power.defenseIgnore,
                hitBonus: power.hitBonus
            }
        });

        // Add visual effect
        const cell = document.getElementById(`cell-${unit.position.row}-${unit.position.col}`);
        const unitElement = cell.querySelector('.unit');
        unitElement.classList.add('power-active', 'precision');

        // Set cooldown
        this.setCooldown(unit, power);

        // Mark unit as acted
        unit.hasActed = true;

        // Log activation
        window.turnManager.logGameEvent(`🎯 ${unit.type} active Tir Précis!`, 'power');
        return true;
    }

    /**
     * Activate Explosion de Feu power
     * @param {Unit} unit - The mage unit
     * @param {Object} power - Power configuration
     * @param {Object} targetPosition - Target position for the explosion
     */
    activateExplosionDeFeu(unit, power, targetPosition) {
        // Check range
        const distance = Math.abs(targetPosition.row - unit.position.row) + 
                        Math.abs(targetPosition.col - unit.position.col);
        if (distance > power.range) {
            window.turnManager.logGameEvent('⚠️ Cible hors de portée');
            return false;
        }

        // Get affected cells (3x3 grid)
        const affectedCells = this.getAoECells(targetPosition, power.aoeRange);
        let hitCount = 0;

        // Apply damage to enemies in range
        affectedCells.forEach(pos => {
            const cell = document.getElementById(`cell-${pos.row}-${pos.col}`);
            if (!cell) return;

            const targetUnit = window.unitManager.getUnitAtPosition(pos);
            if (targetUnit && targetUnit.owner !== unit.owner) {
                // Apply AoE damage
                targetUnit.takeDamage(power.aoeDamage);
                hitCount++;

                // Add visual effect
                cell.classList.add('explosion');
                setTimeout(() => cell.classList.remove('explosion'), 1000);

                // Show damage number
                this.showDamageNumber(cell, power.aoeDamage);
            }
        });

        if (hitCount === 0) {
            window.turnManager.logGameEvent('⚠️ Aucune cible dans la zone d\'effet');
            return false;
        }

        // Add visual effect to caster
        const casterCell = document.getElementById(`cell-${unit.position.row}-${unit.position.col}`);
        const unitElement = casterCell.querySelector('.unit');
        unitElement.classList.add('power-active', 'casting');

        // Set cooldown
        this.setCooldown(unit, power);

        // Mark unit as acted
        unit.hasActed = true;

        // Log activation
        window.turnManager.logGameEvent(`🔥 ${unit.type} lance Explosion de Feu! (${hitCount} cibles touchées)`, 'power');
        return true;
    }

    /**
     * Get cells affected by AoE
     * @param {Object} center - Center position of AoE
     * @param {number} range - Range of AoE
     * @returns {Array} Array of affected positions
     */
    getAoECells(center, range) {
        const cells = [];
        for (let row = center.row - range; row <= center.row + range; row++) {
            for (let col = center.col - range; col <= center.col + range; col++) {
                if (row >= 0 && row < 10 && col >= 0 && col < 10) { // Assuming 10x10 grid
                    cells.push({ row, col });
                }
            }
        }
        return cells;
    }

    /**
     * Show floating damage number
     * @param {HTMLElement} cell - Target cell element
     * @param {number} damage - Damage amount
     */
    showDamageNumber(cell, damage) {
        const damagePopup = document.createElement('div');
        damagePopup.className = 'damage-popup';
        damagePopup.textContent = damage;
        cell.appendChild(damagePopup);
        setTimeout(() => damagePopup.remove(), 1000);
    }

    /**
     * Set cooldown for a power
     * @param {Unit} unit - The unit
     * @param {Object} power - Power configuration
     */
    setCooldown(unit, power) {
        const cooldownKey = `${unit.id}_${power.name}`;
        this.cooldowns.set(cooldownKey, power.cooldown);
    }

    /**
     * Update cooldowns at turn end
     */
    updateCooldowns() {
        this.cooldowns.forEach((value, key) => {
            if (value > 0) {
                this.cooldowns.set(key, value - 1);
            }
        });
    }

    /**
     * Check for and apply riposte damage
     * @param {Unit} attacker - Attacking unit
     * @param {Unit} defender - Defending unit
     * @param {number} damage - Original damage dealt
     */
    checkAndApplyRiposte(attacker, defender, damage) {
        const effect = this.activeEffects.get(defender.id);
        if (effect && effect.effectType === 'riposte') {
            const riposteDamage = Math.floor(damage * effect.params.multiplier);
            if (riposteDamage > 0) {
                attacker.takeDamage(riposteDamage);
                window.turnManager.logGameEvent(`⚔️ ${defender.type} contre-attaque pour ${riposteDamage} dégâts!`, 'power');
                
                // Show riposte damage
                const cell = document.getElementById(`cell-${attacker.position.row}-${attacker.position.col}`);
                this.showDamageNumber(cell, riposteDamage);
            }
        }
    }

    /**
     * Get precision shot bonus if active
     * @param {Unit} unit - The attacking unit
     * @returns {Object} Bonus parameters
     */
    getPrecisionShotBonus(unit) {
        const effect = this.activeEffects.get(unit.id);
        if (effect && effect.effectType === 'precision') {
            // Remove effect after use
            this.activeEffects.delete(unit.id);
            return effect.params;
        }
        return null;
    }

    /**
     * Clean up expired effects
     */
    cleanupEffects() {
        this.activeEffects.forEach((effect, unitId) => {
            effect.duration--;
            if (effect.duration <= 0) {
                this.activeEffects.delete(unitId);
                // Remove visual effects
                const unit = window.unitManager.getUnitById(unitId);
                if (unit) {
                    const cell = document.getElementById(`cell-${unit.position.row}-${unit.position.col}`);
                    if (cell) {
                        const unitElement = cell.querySelector('.unit');
                        if (unitElement) {
                            unitElement.classList.remove('power-active', 'riposte', 'precision', 'casting');
                        }
                    }
                }
            }
        });
    }
}

// Initialize power manager when document is ready
document.addEventListener('DOMContentLoaded', () => {
    window.powerManager = new PowerManager();
}); 