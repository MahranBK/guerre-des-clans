class DefenseManager {
    constructor() {
        // Defense bonus configuration
        this.DEFENSE_BONUS = 2;
        this.defendingUnits = new Map(); // Map<unitId, {unit, bonusAmount, startTurn}>
    }

    /**
     * Start defense mode for a unit
     * @param {Unit} unit - The unit to defend
     */
    startDefense(unit) {
        if (unit.hasActed) {
            window.turnManager.logGameEvent('⚠️ This unit has already acted this turn');
            return false;
        }

        // Get cell for visual effect
        const cell = document.getElementById(`cell-${unit.position.row}-${unit.position.col}`);
        
        // Add defending visual state
        const unitElement = cell.querySelector('.unit');
        unitElement.classList.add('defending');
        unitElement.classList.add('acted'); // Mark as having used its action
        
        // Calculate defense bonus including stacking from other defending units in same cell
        const stackedBonus = this.calculateStackedDefenseBonus(unit);
        
        // Store defending unit info with current turn number
        this.defendingUnits.set(unit.id, {
            unit,
            bonusAmount: stackedBonus,
            startTurn: window.turnManager.state.turnCount
        });

        // Apply defense bonus
        unit.baseDefense = unit.defense; // Store original defense
        unit.defense += stackedBonus;
        unit.temporaryDefense = true;

        // Mark unit as having acted
        unit.hasActed = true;
        unit.hasMoved = true; // Prevent movement after defending

        // Log the action
        window.turnManager.logGameEvent(`🛡️ ${unit.type} takes a defensive stance (+${stackedBonus} DEF)`);
        
        return true;
    }

    /**
     * Calculate total defense bonus including stacking from other defending units
     * @param {Unit} unit - The unit taking defensive stance
     * @returns {number} Total defense bonus
     */
    calculateStackedDefenseBonus(unit) {
        let bonus = this.DEFENSE_BONUS;
        
        // Check for other defending units in the same cell
        const cell = document.getElementById(`cell-${unit.position.row}-${unit.position.col}`);
        const unitsInCell = this.getUnitsInCell(cell);
        
        // Count defending allies in the same cell
        let defendingAllies = 0;
        unitsInCell.forEach(otherUnit => {
            if (otherUnit.id !== unit.id && 
                otherUnit.owner === unit.owner && 
                this.defendingUnits.has(otherUnit.id)) {
                defendingAllies++;
            }
        });

        // Stack defense bonuses - each additional defender adds 50% of base bonus
        if (defendingAllies > 0) {
            bonus += (this.DEFENSE_BONUS * 0.5 * defendingAllies);
            window.turnManager.logGameEvent(`💫 Defense bonus stacked with ${defendingAllies} other defender${defendingAllies > 1 ? 's' : ''}!`);
        }

        return Math.floor(bonus); // Round down the final bonus
    }

    /**
     * Get all units in a cell
     * @param {HTMLElement} cell - The cell element
     * @returns {Array<Unit>} Array of units in the cell
     */
    getUnitsInCell(cell) {
        const unitId = cell.dataset.unitId;
        if (!unitId) return [];
        
        return [window.unitManager.getUnitById(unitId)].filter(Boolean);
    }

    /**
     * Get total defense bonus for a cell
     * @param {HTMLElement} cell - The cell being attacked
     * @returns {number} Combined defense bonus of all defending units
     */
    getCellDefenseBonus(cell) {
        const unitsInCell = this.getUnitsInCell(cell);
        let totalBonus = 0;

        unitsInCell.forEach(unit => {
            if (unit.temporaryDefense) {
                const defenseInfo = this.defendingUnits.get(unit.id);
                if (defenseInfo) {
                    totalBonus += defenseInfo.bonusAmount;
                }
            }
        });

        return totalBonus;
    }

    /**
     * Reset defense state at the end of turn
     * @param {string} currentPlayer - The player whose turn is ending
     */
    resetDefenseState(currentPlayer) {
        const currentTurn = window.turnManager.state.turnCount;
        
        // Remove defense bonuses and visual states for units that defended two turns ago
        this.defendingUnits.forEach((info, unitId) => {
            const { unit, startTurn } = info;
            
            // Reset defense if it's been active for a full round (both players' turns)
            if (currentTurn > startTurn + 1) {
                // Reset defense to base value
                if (unit.temporaryDefense) {
                    unit.defense = unit.baseDefense;
                    unit.temporaryDefense = false;
                }
                
                // Remove defending visual state
                const cell = document.getElementById(`cell-${unit.position.row}-${unit.position.col}`);
                if (cell) {
                    const unitElement = cell.querySelector('.unit');
                    if (unitElement) {
                        unitElement.classList.remove('defending');
                    }
                }
                
                // Remove from defending units map
                this.defendingUnits.delete(unitId);
                
                window.turnManager.logGameEvent(`🛡️ ${unit.type}'s defensive stance ends`);
            }
        });
    }

    /**
     * Get the current defense bonus for a unit
     * @param {Unit} unit - The unit to check
     * @returns {number} Current defense bonus (0 if not defending)
     */
    getDefenseBonus(unit) {
        const info = this.defendingUnits.get(unit.id);
        return info ? info.bonusAmount : 0;
    }
}

// Initialize defense manager when document is ready
document.addEventListener('DOMContentLoaded', () => {
    window.defenseManager = new DefenseManager();
}); 