class CombatManager {
    constructor() {
        // Attack range configurations
        this.ATTACK_RANGES = {
            warrior: { min: 1, max: 1 },
            archer: { min: 2, max: 3 },
            mage: { min: 1, max: 2 }
        };

        // Minimum roll needed to hit
        this.HIT_THRESHOLD = 3;
    }

    /**
     * Calculate valid attack targets for a unit
     * @param {Unit} unit - The attacking unit
     * @returns {Array} Array of valid target positions
     */
    getValidTargets(unit) {
        const validTargets = [];
        
        // Debug log
        console.log('Checking targets for unit:', {
            type: unit.type,
            position: unit.position,
            owner: unit.owner
        });

        // Check all cells within maximum range
        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 10; col++) {
                const distance = Math.abs(row - unit.position.row) + 
                               Math.abs(col - unit.position.col);
                
                // Debug log for distance calculation
                console.log(`Checking cell (${row}, ${col}), distance: ${distance}`);
                
                const cell = document.getElementById(`cell-${row}-${col}`);
                if (!cell) {
                    console.log(`Cell not found: cell-${row}-${col}`);
                    continue;
                }

                const targetUnitId = cell.dataset.unitId;
                if (targetUnitId) {
                    const targetUnit = window.unitManager.getUnitById(targetUnitId);
                    console.log('Found unit in cell:', {
                        targetId: targetUnitId,
                        targetOwner: targetUnit?.owner,
                        isEnemy: targetUnit?.owner !== unit.owner
                    });

                    if (targetUnit && targetUnit.owner !== unit.owner) {
                        // Check if cell is in range based on unit type
                        if (this.isValidAttackDistance(unit.type, distance)) {
                            console.log(`Valid target found at (${row}, ${col})`);
                            validTargets.push({ row, col });
                        } else {
                            console.log(`Target in invalid range. Distance: ${distance}, Unit type: ${unit.type}`);
                        }
                    }
                }
            }
        }

        console.log('Valid targets found:', validTargets);
        return validTargets;
    }

    /**
     * Check if attack distance is valid for unit type
     * @param {string} unitType - Type of the attacking unit
     * @param {number} distance - Manhattan distance to target
     * @returns {boolean}
     */
    isValidAttackDistance(unitType, distance) {
        const range = this.ATTACK_RANGES[unitType.toLowerCase()];
        if (!range) {
            console.error(`Invalid unit type: ${unitType}`);
            return false;
        }
        
        // Debug log
        console.log('Checking attack distance:', {
            unitType,
            distance,
            range,
            isValid: distance >= range.min && distance <= range.max
        });
        
        // Archers cannot attack adjacent units
        if (unitType.toLowerCase() === 'archer' && distance === 1) {
            return false;
        }
        
        return distance >= range.min && distance <= range.max;
    }

    /**
     * Highlight valid attack targets
     * @param {Unit} unit - The attacking unit
     * @returns {boolean} Whether there are any valid targets
     */
    showAttackRange(unit) {
        const validTargets = this.getValidTargets(unit);
        
        // Remove any existing highlights
        this.removeAttackRange();
        
        // Add highlight to valid targets
        validTargets.forEach(pos => {
            const cell = document.getElementById(`cell-${pos.row}-${pos.col}`);
            cell.classList.add('valid-target');
        });

        // Return whether there are any valid targets
        return validTargets.length > 0;
    }

    /**
     * Start attack mode for a unit
     * @param {Unit} unit - The attacking unit
     * @returns {boolean} Whether attack mode was started
     */
    startAttack(unit) {
        if (unit.hasActed) {
            window.turnManager.logGameEvent('⚠️ This unit has already acted this turn');
            return false;
        }

        // Check if there are any valid targets
        if (!this.showAttackRange(unit)) {
            window.turnManager.logGameEvent('⚠️ No enemies in range!');
            return false;
        }

        window.turnManager.logGameEvent(`⚔️ Select a target for ${unit.type} to attack`);
        return true;
    }

    /**
     * Remove attack range highlights
     */
    removeAttackRange() {
        document.querySelectorAll('.valid-target').forEach(cell => {
            cell.classList.remove('valid-target');
        });
    }

    /**
     * Apply damage to a unit and handle death
     * @param {Unit} attacker - The attacking unit
     * @param {Unit} defender - The defending unit
     * @param {number} damage - Amount of damage
     * @param {boolean} isCritical - Whether this was a critical hit
     */
    applyDamage(attacker, defender, damage, isCritical) {
        // Get cells for visual effects
        const attackerCell = document.getElementById(`cell-${attacker.position.row}-${attacker.position.col}`);
        const defenderCell = document.getElementById(`cell-${defender.position.row}-${defender.position.col}`);
        
        // Add attack animation
        attackerCell.classList.add('attacking');
        setTimeout(() => attackerCell.classList.remove('attacking'), 300);

        // Add hit animation
        defenderCell.classList.add('being-hit');
        setTimeout(() => defenderCell.classList.remove('being-hit'), 300);

        // Create and show damage popup
        const damagePopup = document.createElement('div');
        damagePopup.className = `damage-popup${isCritical ? ' critical-hit' : ''}`;
        damagePopup.textContent = damage;
        
        // Position the popup above the defender
        const cellRect = defenderCell.getBoundingClientRect();
        damagePopup.style.left = `${cellRect.left + cellRect.width/2}px`;
        damagePopup.style.top = `${cellRect.top}px`;
        document.body.appendChild(damagePopup);

        // Remove popup after animation
        setTimeout(() => damagePopup.remove(), 1000);

        // Apply damage
        defender.hp -= damage;
        
        // Update health bar
        this.updateHealthBar(defender);
        
        // Log the attack with visual enhancement
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry attack${isCritical ? ' critical' : ''}`;
        const criticalText = isCritical ? ' (Critical Hit!)' : '';
        logEntry.textContent = `⚔️ ${attacker.type} attacks ${defender.type}${criticalText} for ${damage} damage!`;
        window.turnManager.logContent.appendChild(logEntry);
        window.turnManager.logContent.scrollTop = window.turnManager.logContent.scrollHeight;

        // Check for unit death
        if (defender.hp <= 0) {
            this.handleUnitDeath(defender);
        }
    }

    /**
     * Update the health bar of a unit
     * @param {Unit} unit - The unit to update
     */
    updateHealthBar(unit) {
        const cell = document.getElementById(`cell-${unit.position.row}-${unit.position.col}`);
        let healthBar = cell.querySelector('.health-bar');
        
        // Create health bar if it doesn't exist
        if (!healthBar) {
            healthBar = document.createElement('div');
            healthBar.className = 'health-bar';
            healthBar.innerHTML = '<div class="health-fill"></div>';
            cell.appendChild(healthBar);
        }

        // Update health fill
        const healthFill = healthBar.querySelector('.health-fill');
        const healthPercentage = (unit.hp / unit.maxHp) * 100;
        healthFill.style.width = `${healthPercentage}%`;
    }

    /**
     * Get dice dots pattern HTML for a given number
     * @param {number} num - The dice number (1-6)
     * @returns {string} HTML for the dice dots
     */
    getDiceDots(num) {
        const patterns = {
            1: `<div class="dot" style="grid-area: 2/2"></div>`,
            2: `<div class="dot" style="grid-area: 1/1"></div>
                <div class="dot" style="grid-area: 3/3"></div>`,
            3: `<div class="dot" style="grid-area: 1/1"></div>
                <div class="dot" style="grid-area: 2/2"></div>
                <div class="dot" style="grid-area: 3/3"></div>`,
            4: `<div class="dot" style="grid-area: 1/1"></div>
                <div class="dot" style="grid-area: 1/3"></div>
                <div class="dot" style="grid-area: 3/1"></div>
                <div class="dot" style="grid-area: 3/3"></div>`,
            5: `<div class="dot" style="grid-area: 1/1"></div>
                <div class="dot" style="grid-area: 1/3"></div>
                <div class="dot" style="grid-area: 2/2"></div>
                <div class="dot" style="grid-area: 3/1"></div>
                <div class="dot" style="grid-area: 3/3"></div>`,
            6: `<div class="dot" style="grid-area: 1/1"></div>
                <div class="dot" style="grid-area: 1/3"></div>
                <div class="dot" style="grid-area: 2/1"></div>
                <div class="dot" style="grid-area: 2/3"></div>
                <div class="dot" style="grid-area: 3/1"></div>
                <div class="dot" style="grid-area: 3/3"></div>`
        };
        return patterns[num] || '';
    }

    /**
     * Roll a D6 die
     * @param {Unit} attacker - The attacking unit
     * @param {Unit} defender - The defending unit
     * @returns {Promise<number>} The roll result (1-6)
     */
    async rollD6(attacker, defender) {
        const diceElement = document.querySelector('.dice');
        if (!diceElement) return Math.floor(Math.random() * 6) + 1;

        // Add rolling animation class
        diceElement.classList.add('rolling');
        
        // Generate random rolls for animation
        const animationDuration = 1000; // 1 second
        const startTime = Date.now();
        
        // Add dice dots container styles
        const diceStyle = `
            width: 80%; 
            height: 80%; 
            display: grid;
            grid-template: repeat(3, 1fr) / repeat(3, 1fr);
            gap: 5px;
            padding: 10px;
            background: #222;
            border: 2px solid #ffd700;
            border-radius: 8px;
        `;

        const dotStyle = `
            width: 8px;
            height: 8px;
            background: #ffd700;
            border-radius: 50%;
            margin: auto;
        `;

        // Add styles to head
        if (!document.querySelector('#dice-styles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'dice-styles';
            styleSheet.textContent = `
                .dice-dots { ${diceStyle} }
                .dice-dots .dot { ${dotStyle} }
            `;
            document.head.appendChild(styleSheet);
        }
        
        return new Promise(resolve => {
            const animate = () => {
                const currentTime = Date.now();
                const elapsed = currentTime - startTime;
                
                if (elapsed < animationDuration) {
                    const tempRoll = Math.floor(Math.random() * 6) + 1;
                    diceElement.innerHTML = `
                        <div class="dice-dots">
                            ${this.getDiceDots(tempRoll)}
                        </div>
                    `;
                    requestAnimationFrame(animate);
                } else {
                    // Final roll
                    const finalRoll = Math.floor(Math.random() * 6) + 1;
                    diceElement.innerHTML = `
                        <div class="dice-dots">
                            ${this.getDiceDots(finalRoll)}
                        </div>
                    `;
                    diceElement.classList.remove('rolling');
                    resolve(finalRoll);
                }
            };
            
            requestAnimationFrame(animate);
        });
    }

    /**
     * Calculate and apply damage
     * @param {Unit} attacker - The attacking unit
     * @param {Unit} defender - The defending unit
     * @returns {number} Amount of damage dealt
     */
    calculateDamage(attacker, defender, precisionBonus = null) {
        let defense = defender.defense;
        
        // Apply precision shot defense ignore
        if (precisionBonus) {
            defense = Math.floor(defense * (1 - precisionBonus.defenseIgnore));
        }

        // Calculate base damage
        let damage = Math.max(1, attacker.attack - defense);

        return damage;
    }

    /**
     * Perform an attack
     * @param {Unit} attacker - The attacking unit
     * @param {Unit} defender - The defending unit
     * @returns {Promise<Object>} Attack result
     */
    async performAttack(attacker, defender) {
        // Check for precision shot bonus
        const precisionBonus = window.powerManager.getPrecisionShotBonus(attacker);
        
        // Roll for hit
        const roll = await this.rollD6(attacker, defender);
        const hitThreshold = precisionBonus ? this.HIT_THRESHOLD - precisionBonus.hitBonus : this.HIT_THRESHOLD;
        const isHit = roll >= hitThreshold;
        
        if (!isHit) {
            window.turnManager.logGameEvent(`❌ ${attacker.type}'s attack missed! (Rolled ${roll})`);
            return { hit: false, damage: 0 };
        }

        // Calculate and apply damage
        let damage = this.calculateDamage(attacker, defender, precisionBonus);
        const isCritical = roll === 6;
        const finalDamage = isCritical ? Math.floor(damage * 1.5) : damage;

        // Apply damage
        defender.takeDamage(finalDamage);

        // Check for and apply riposte
        window.powerManager.checkAndApplyRiposte(attacker, defender, finalDamage);

        // Log the attack
        const critText = isCritical ? ' (Coup Critique!)' : '';
        const precisionText = precisionBonus ? ' (Tir Précis!)' : '';
        window.turnManager.logGameEvent(
            `💥 ${attacker.type} inflige ${finalDamage} dégâts à ${defender.type}${critText}${precisionText}`,
            isCritical ? 'critical' : 'attack'
        );

        return { hit: true, damage: finalDamage, isCritical };
    }

    /**
     * Get all units in a cell
     * @param {HTMLElement} cell - The cell element
     * @returns {Array} Array of units in the cell
     */
    getUnitsInCell(cell) {
        const unitId = cell.dataset.unitId;
        if (!unitId) return [];
        
        return [window.unitManager.getUnitById(unitId)].filter(Boolean);
    }

    /**
     * Handle unit death
     * @param {Unit} unit - The unit that died
     */
    handleUnitDeath(unit) {
        window.turnManager.logGameEvent(`💀 ${unit.type} has been defeated!`);
        
        // Remove unit from the game
        window.unitManager.removeUnit(unit.id);
        
        // Check for game end
        this.checkGameEnd();
    }

    /**
     * Check if the game has ended
     */
    checkGameEnd() {
        const player1Units = window.unitManager.units.player1.length;
        const player2Units = window.unitManager.units.player2.length;
        
        if (player1Units === 0) {
            window.turnManager.logGameEvent('🏆 Player 2 wins!');
            // Trigger game end
        } else if (player2Units === 0) {
            window.turnManager.logGameEvent('🏆 Player 1 wins!');
            // Trigger game end
        }
    }

    /**
     * Handle attack action
     * @param {HTMLElement} targetCell - The cell being attacked
     */
    async handleAttack(targetCell) {
        if (!this.selectedUnit || !targetCell) return;

        const targetUnit = this.getUnitInCell(targetCell);
        if (!targetUnit) return;

        // Check if target is in range and is an enemy
        if (!this.isValidTarget(targetCell) || targetUnit.owner === this.selectedUnit.owner) {
            window.turnManager.logGameEvent("❌ Invalid target!");
            return;
        }

        try {
            const result = await this.performAttack(this.selectedUnit, targetUnit);
            
            // Update UI and play animations
            if (result.hit) {
                this.playAttackAnimation(this.selectedUnit, targetUnit, result);
            }
            
            // Reset selection after attack
            this.clearSelection();
            this.clearValidTargets();
            
            // Check for game over
            if (this.checkGameOver()) {
                window.turnManager.endGame();
            }
        } catch (error) {
            console.error("Attack failed:", error);
            window.turnManager.logGameEvent("❌ Attack failed due to an error!");
        }
    }
}

// Initialize combat manager when document is ready
document.addEventListener('DOMContentLoaded', () => {
    window.combatManager = new CombatManager();
}); 