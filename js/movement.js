class MovementManager {
    constructor() {
        this.selectedUnit = null;
        this.validMoves = [];
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Add click listeners to all grid cells
        document.querySelectorAll('.grid-cell').forEach(cell => {
            cell.addEventListener('click', (e) => this.handleCellClick(e));
        });
    }

    handleCellClick(event) {
        const cell = event.currentTarget;
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);

        // If no unit is selected and clicked cell has a unit of current player
        if (!this.selectedUnit && cell.dataset.unitId) {
            const unit = window.unitManager.getUnitById(cell.dataset.unitId);
            if (unit && unit.owner === window.turnManager.state.currentPlayer && !unit.hasMoved) {
                this.selectUnit(unit);
            }
            return;
        }

        // If unit is selected and clicked cell is a valid move
        if (this.selectedUnit && this.isValidMove(row, col)) {
            this.moveUnit(row, col);
            return;
        }

        // If user clicks elsewhere other than than a valid cell then deselect unit
        this.deselectUnit();
    }

    selectUnit(unit) {
        this.selectedUnit = unit;
        // Highlight the selected unit's cell
        const cell = document.getElementById(`cell-${unit.position.row}-${unit.position.col}`);
        cell.classList.add('selected');
        // Show valid moves
        this.showValidMoves();
    }

    deselectUnit() {
        if (this.selectedUnit) {
            // Remove selection highlight
            const cell = document.getElementById(`cell-${this.selectedUnit.position.row}-${this.selectedUnit.position.col}`);
            cell.classList.remove('selected');
            // Remove valid move highlights
            this.hideValidMoves();
            this.selectedUnit = null;
            this.validMoves = [];
        }
    }

    isValidMove(row, col) {
        return this.validMoves.some(move => move.row === row && move.col === col);
    }

    showValidMoves() {
        this.validMoves = this.calculateValidMoves();
        this.validMoves.forEach(move => {
            const cell = document.getElementById(`cell-${move.row}-${move.col}`);
            cell.classList.add('valid-move');
        });
    }

    hideValidMoves() {
        document.querySelectorAll('.valid-move').forEach(cell => {
            cell.classList.remove('valid-move');
        });
    }

    calculateValidMoves() {
        const validMoves = [];
        const unit = this.selectedUnit;
        const moveRange = unit.moveRange;

        // Check all cells within move range
        for (let row = Math.max(0, unit.position.row - moveRange); row <= Math.min(9, unit.position.row + moveRange); row++) {
            for (let col = Math.max(0, unit.position.col - moveRange); col <= Math.min(9, unit.position.col + moveRange); col++) {
                
                // Skip current position
                if (row === unit.position.row && col === unit.position.col) continue;

                // Check if move is within range using manhattan distance formula
                const distance = Math.abs(row - unit.position.row) + Math.abs(col - unit.position.col);
                if (distance <= moveRange) {
                    // Check if cell is empty or has only allied units
                    const cell = document.getElementById(`cell-${row}-${col}`);
                    if (!cell.dataset.unitId || this.isAlliedUnit(cell.dataset.unitId)) {
                        validMoves.push({ row, col });
                    }
                }
            }
        }

        return validMoves;
    }

    isAlliedUnit(unitId) {
        const unit = window.unitManager.getUnitById(unitId);
        return unit && unit.owner === this.selectedUnit.owner;
    }

    moveUnit(newRow, newCol) {
        const unit = this.selectedUnit;
        const oldCell = document.getElementById(`cell-${unit.position.row}-${unit.position.col}`);
        const newCell = document.getElementById(`cell-${newRow}-${newCol}`);

        // Update unit position
        unit.position = { row: newRow, col: newCol };
        unit.hasMoved = true;

        // Update grid display
        window.unitPlacer.updateGridDisplay();

        // Log the movement
        window.turnManager.logGameEvent(`${unit.owner === 'player1' ? '🟦' : '🟥'} ${unit.type} moved to row ${newRow + 1}, column ${newCol + 1}`);

        // Deselect unit after move
        this.deselectUnit();
    }
}

// Initialize movement manager when document is ready
document.addEventListener('DOMContentLoaded', () => {
    window.movementManager = new MovementManager();
}); 