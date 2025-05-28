class DefenseManager {
    constructor() {
        this.DEFENSE_BONUS = 2;
        this.defendingUnits = new Map();
    }

    startDefense(unit) {
        if (unit.hasActed) {
            window.turnManager.logGameEvent('⚠️ This unit has already acted this turn');
            return false;
        }

        const cell = document.getElementById(`cell-${unit.position.row}-${unit.position.col}`);
        const unitElement = cell.querySelector('.unit');
        unitElement.classList.add('defending');
        unitElement.classList.add('acted');
        
        const defenseBonus = this.DEFENSE_BONUS;
        
        this.defendingUnits.set(unit.id, {
            unit,
            bonusAmount: defenseBonus,
            startTurn: window.turnManager.state.turnCount
        });

        // apply defense bonus & keep the baseDefense backup
        unit.baseDefense = unit.defense;
        unit.defense += defenseBonus;
        unit.temporaryDefense = true;

        unit.hasActed = true;
        unit.hasMoved = true;

        window.turnManager.logGameEvent(`🛡️ ${unit.type} takes a defensive stance (+${defenseBonus} DEF)`);
        return true;
    }

    resetDefenseState(currentPlayer) {
        const currentTurn = window.turnManager.state.turnCount;
        
        this.defendingUnits.forEach((info, unitId) => {
            const { unit, startTurn } = info;
            
            if (currentTurn > startTurn + 1) {
                if (unit.temporaryDefense) {
                    unit.defense = unit.baseDefense;
                    unit.temporaryDefense = false;
                }
                
                const cell = document.getElementById(`cell-${unit.position.row}-${unit.position.col}`);
                if (cell) {
                    const unitElement = cell.querySelector('.unit');
                    if (unitElement) {
                        unitElement.classList.remove('defending');
                    }
                }
                
                this.defendingUnits.delete(unitId);
                window.turnManager.logGameEvent(`🛡️ ${unit.type}'s defensive stance ends`);
            }
        });
    }

    getDefenseBonus(unit) {
        const info = this.defendingUnits.get(unit.id);
        return info ? info.bonusAmount : 0;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.defenseManager = new DefenseManager();
});