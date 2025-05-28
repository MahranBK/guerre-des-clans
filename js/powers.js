class PowerManager {
    constructor() {
        // units powers config
        this.powers = {
            warrior: [{
                name: 'Counter-Attack',
                description: 'If attacked on the next turn, reflects some of the damage back to the attacker.',
                range: 0,
                cooldown: 1,
                riposteMultiplier: 0.5 // 50% damage return
            }],
            archer: [{
                name: 'Precise Shot',
                description: 'Next shot ignores 50% of the enemy\'s defense.',
                range: 0,
                cooldown: 1,
                defenseIgnore: 0.5,
                hitBonus: 1 // Reduces hit threshold by 1
            }],
            mage: [{
                name: 'Fire Explosion',
                description: 'Deals damage to enemies in a 3x3 area.',
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


    startPowerSelection(unit) {
        if (unit.hasActed) {
            window.turnManager.logGameEvent('⚠️ This unit has already acted');
            return false;
        }

        const availablePowers = this.powers[unit.type.toLowerCase()];
        if (!availablePowers || availablePowers.length === 0) {
            window.turnManager.logGameEvent('⚠️ This unit has no available power');
            return false;
        }

        // Check cooldowns
        const power = availablePowers[0]; // Currently one power per type
        const cooldownKey = `${unit.id}_${power.name}`;
        if (this.cooldowns.get(cooldownKey) > 0) {
            window.turnManager.logGameEvent('⚠️ ${power.name} is still on cooldown');
            return false;
        }

        return true;
    }


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

    
    activateTirPrecis(unit, power) {
        // Set up precision shot effect
        this.activeEffects.set(unit.id, {
            effectType: 'precision',
            duration: 1, // until next attack (1 turn duration)
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
        window.turnManager.logGameEvent(`🎯 ${unit.type} activates precise  shot !`, 'power');
        return true;
    }

    
    activateExplosionDeFeu(unit, power, targetPosition) {
        // Check range
        const distance = Math.abs(targetPosition.row - unit.position.row) + 
                        Math.abs(targetPosition.col - unit.position.col);
        if (distance > power.range) {
            window.turnManager.logGameEvent('⚠️ Target out of range');
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
            window.turnManager.logGameEvent('⚠️ No target is in the aoE');
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
        window.turnManager.logGameEvent(`🔥 ${unit.type} launches fire explosionss! (${hitCount} cibles touchées)`, 'power');
        return true;
    }

    
    getAoECells(center, range) {
        const cells = [];
        for (let row = center.row - range; row <= center.row + range; row++) {
            for (let col = center.col - range; col <= center.col + range; col++) {
                if (row >= 0 && row < 10 && col >= 0 && col < 10) {
                    cells.push({ row, col });
                }
            }
        }
        return cells;
    }

    
    showDamageNumber(cell, damage) {
        const damagePopup = document.createElement('div');
        damagePopup.className = 'damage-popup';
        damagePopup.textContent = damage;
        cell.appendChild(damagePopup);
        setTimeout(() => damagePopup.remove(), 1000);
    }

    
    setCooldown(unit, power) {
        const cooldownKey = `${unit.id}_${power.name}`;
        this.cooldowns.set(cooldownKey, power.cooldown);
    }

    //Update cooldowns at turn end
    
    updateCooldowns() {
        this.cooldowns.forEach((value, key) => {
            if (value > 0) {
                this.cooldowns.set(key, value - 1);
            }
        });
    }


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

    
    getPrecisionShotBonus(unit) {
        const effect = this.activeEffects.get(unit.id);
        if (effect && effect.effectType === 'precision') {
            // Remove effect after use
            this.activeEffects.delete(unit.id);
            return effect.params;
        }
        return null;
    }

    //Clean up expired effects
    
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