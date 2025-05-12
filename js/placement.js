// Unit placement logic
class UnitPlacer {
    constructor(unitManager) {
        this.unitManager = unitManager;
        this.selectedUnit = null;
        this.isPlacementPhase = true;
        this.currentPlacingPlayer = 'player1';
        
        // Do initial random placement
        this.placeAllUnits();
        
        // Initialize placement phase
        this.initializePlacementPhase();
    }

    initializePlacementPhase() {
        // Add click listeners to all grid cells for placement
        document.querySelectorAll('.grid-cell').forEach(cell => {
            cell.addEventListener('click', (e) => this.handlePlacementClick(e));
        });

        // Add random placement button
        this.addPlacementControls();
        
        // Hide dice section during placement
        document.querySelector('.dice-section').style.display = 'none';
        
        // Update game status
        window.turnManager.updateGameStatus('Placement Phase: Player 1 can rearrange units (rows 1-3)');
        window.turnManager.logGameEvent('📍 Players can now rearrange their units');
    }

    addPlacementControls() {
        const controls = document.createElement('div');
        controls.className = 'placement-controls';
        controls.innerHTML = `
            <button id="randomizeBtn">Randomize Units</button>
            <button id="confirmPlacementBtn">Confirm Placement</button>
        `;
        
        document.querySelector('.game-controls').prepend(controls);

        // Add event listeners
        document.getElementById('randomizeBtn').addEventListener('click', () => {
            this.placeAllUnits();
            window.turnManager.logGameEvent(`🎲 ${this.currentPlacingPlayer === 'player1' ? 'Player 1' : 'Player 2'} randomized their units`);
        });

        document.getElementById('confirmPlacementBtn').addEventListener('click', () => this.confirmPlacement());
    }

    handlePlacementClick(event) {
        if (!this.isPlacementPhase) return;

        const cell = event.currentTarget;
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);

        // Check if click is in valid placement zone for current player
        const isValidZone = this.isValidPlacementZone(row);
        if (!isValidZone) {
            window.turnManager.logGameEvent('❌ Invalid placement zone');
            return;
        }

        // If a unit is selected, try to place it
        if (this.selectedUnit) {
            this.moveUnitToCell(this.selectedUnit, row, col);
            this.selectedUnit = null;
            this.clearHighlights();
            return;
        }

        // If no unit is selected and clicked on a unit, select it
        if (cell.dataset.unitId) {
            const unit = this.unitManager.getUnitById(cell.dataset.unitId);
            if (unit && unit.owner === this.currentPlacingPlayer) {
                this.selectUnitForPlacement(unit);
            }
        }
    }

    selectUnitForPlacement(unit) {
        this.selectedUnit = unit;
        this.clearHighlights();
        
        // Highlight selected unit
        const cell = document.getElementById(`cell-${unit.position.row}-${unit.position.col}`);
        cell.classList.add('selected');

        // Highlight valid placement cells
        this.showValidPlacementCells();
    }

    showValidPlacementCells() {
        const startRow = this.currentPlacingPlayer === 'player1' ? 0 : 7;
        const endRow = this.currentPlacingPlayer === 'player1' ? 2 : 9;

        for (let row = startRow; row <= endRow; row++) {
            for (let col = 0; col < 10; col++) {
                const cell = document.getElementById(`cell-${row}-${col}`);
                if (!cell.dataset.unitId || cell.dataset.unitId === this.selectedUnit.id) {
                    cell.classList.add('valid-move');
                }
            }
        }
    }

    clearHighlights() {
        document.querySelectorAll('.grid-cell').forEach(cell => {
            cell.classList.remove('selected', 'valid-move');
        });
    }

    isValidPlacementZone(row) {
        if (this.currentPlacingPlayer === 'player1') {
            return row >= 0 && row <= 2;
        } else {
            return row >= 7 && row <= 9;
        }
    }

    moveUnitToCell(unit, row, col) {
        // Update unit position
        unit.position = { row, col };
        
        // Update grid display
        this.updateGridDisplay();
        
        window.turnManager.logGameEvent(`📍 ${unit.type} moved to row ${row + 1}, column ${col + 1}`);
    }

    confirmPlacement() {
        if (this.currentPlacingPlayer === 'player1') {
            this.currentPlacingPlayer = 'player2';
            window.turnManager.updateGameStatus('Placement Phase: Player 2 can rearrange units (rows 8-10)');
            window.turnManager.logGameEvent('📍 Player 2\'s turn to arrange units');
        } else {
            // End placement phase
            this.endPlacementPhase();
        }
        this.clearHighlights();
        this.selectedUnit = null;
    }

    endPlacementPhase() {
        this.isPlacementPhase = false;
        
        // Remove placement controls
        const controls = document.querySelector('.placement-controls');
        if (controls) controls.remove();

        // Remove placement event listeners
        document.querySelectorAll('.grid-cell').forEach(cell => {
            cell.removeEventListener('click', this.handlePlacementClick);
        });

        // Show dice section and update its style
        const diceSection = document.querySelector('.dice-section');
        diceSection.style.display = 'flex';
        diceSection.classList.add('show');

        // Start the actual game
        window.turnManager.state.isSetupPhase = true;
        window.turnManager.initializeGame();
        window.turnManager.logGameEvent('🎮 Unit placement completed - Roll dice to start the game!');
    }

    placeAllUnits() {
        // Place Player 1 units in top zone (rows 0-2)
        this.placePlayerUnits('player1', 0, 2);
        
        // Place Player 2 units in bottom zone (rows 7-9)
        this.placePlayerUnits('player2', 7, 9);
        
        // Update the grid display
        this.updateGridDisplay();
    }

    placePlayerUnits(player, startRow, endRow) {
        const units = this.unitManager.units[player];
        const availablePositions = this.getAvailablePositions(startRow, endRow);
        
        // Randomly place each unit
        units.forEach(unit => {
            if (availablePositions.length > 0) {
                // Get random position and remove it from available positions
                const randomIndex = Math.floor(Math.random() * availablePositions.length);
                const position = availablePositions.splice(randomIndex, 1)[0];
                
                // Set unit position
                unit.position = position;
            }
        });
    }

    getAvailablePositions(startRow, endRow) {
        const positions = [];
        for (let row = startRow; row <= endRow; row++) {
            for (let col = 0; col < 10; col++) {
                positions.push({ row, col });
            }
        }
        return positions;
    }

    updateGridDisplay() {
        // Clear all cells first
        document.querySelectorAll('.grid-cell').forEach(cell => {
            cell.innerHTML = '';
            cell.classList.remove('occupied', 'player1-unit', 'player2-unit');
            delete cell.dataset.unitId;
        });

        // Place units on the grid
        ['player1', 'player2'].forEach(player => {
            this.unitManager.units[player].forEach(unit => {
                if (unit.position) {
                    const cell = document.getElementById(`cell-${unit.position.row}-${unit.position.col}`);
                    if (cell) {
                        // Create unit display element
                        const unitElement = document.createElement('div');
                        unitElement.className = `unit ${player}-unit`;
                        unitElement.innerHTML = `
                            <div class="unit-symbol">${unit.symbol}</div>
                            <div class="unit-health-bar">
                                <div class="health-fill" style="width: ${(unit.hp / unit.maxHp) * 100}%"></div>
                            </div>
                        `;
                        
                        // Add data attributes for easy access
                        cell.dataset.unitId = unit.id;
                        cell.classList.add('occupied', `${player}-unit`);
                        
                        // Add the unit element to the cell
                        cell.appendChild(unitElement);
                    }
                }
            });
        });
    }
}

// Initialize placement when document is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait a brief moment to ensure unitManager is initialized
    setTimeout(() => {
        if (window.unitManager) {
            window.unitPlacer = new UnitPlacer(window.unitManager);
        }
    }, 100);
}); 