// Game state and turn management
class TurnManager {
    constructor() {
        this.state = {
            isSetupPhase: true,
            currentPlayer: null,
            currentPhase: 'setup',
            diceRolls: { player1: null, player2: null },
            turnCount: 0,
            selectedUnit: null
        };

        // Cache DOM elements
        this.gameStatus = document.getElementById('game-status');
        this.logContent = document.getElementById('log-content');
        this.diceElement = document.getElementById('dice');
        this.rollDiceBtn = document.getElementById('roll-dice');
        this.actionButtons = document.querySelectorAll('.action-buttons button');
        
        // Create unit info display (hidden initially)
        this.unitInfo = document.createElement('div');
        this.unitInfo.className = 'unit-info-display';
        document.querySelector('.game-controls').appendChild(this.unitInfo);

        // Bind event listeners
        this.rollDiceBtn.addEventListener('click', () => this.handleDiceRoll());
        this.setupActionButtons();
        this.setupUnitSelection();

        // Initialize dice images
        this.diceImages = [
            '../assets/images/dice/dice1.svg',
            '../assets/images/dice/dice2.svg',
            '../assets/images/dice/dice3.svg',
            '../assets/images/dice/dice4.svg',
            '../assets/images/dice/dice5.svg',
            '../assets/images/dice/dice6.svg'
        ];

        // Start the game setup
        this.initializeGame();
    }

    initializeGame() {
        this.updateGameStatus('Setup Phase: Roll dice to determine starting player');
        this.logGameEvent('🎮 Game Started - Roll dice to determine who goes first!');
        this.showOnlyDiceButton();
    }

    showOnlyDiceButton() {
        this.rollDiceBtn.style.display = 'block';
        this.actionButtons.forEach(btn => {
            if (btn.id !== 'roll-dice') {
                btn.style.display = 'none';
            }
        });
    }

    showActionButtons() {
        this.rollDiceBtn.style.display = 'none';
        this.actionButtons.forEach(btn => {
            if (btn.id !== 'roll-dice') {
                btn.style.display = 'block';
            }
        });
    }

    setupActionButtons() {
        document.getElementById('moveBtn').addEventListener('click', () => this.handleMove());
        document.getElementById('attackBtn').addEventListener('click', () => this.handleAttack());
        document.getElementById('defendBtn').addEventListener('click', () => this.handleDefend());
        document.getElementById('powerBtn').addEventListener('click', () => this.handlePower());
        document.getElementById('endTurnBtn').addEventListener('click', () => this.endTurn());
    }

    setupUnitSelection() {
        document.querySelectorAll('.grid-cell').forEach(cell => {
            cell.addEventListener('click', (e) => this.handleUnitSelection(e));
        });
    }

    handleUnitSelection(event) {
        if (this.state.isSetupPhase) return;

        const cell = event.currentTarget;
        const unitId = cell.dataset.unitId;

        if (unitId) {
            const unit = window.unitManager.getUnitById(unitId);
            if (unit && unit.owner === this.state.currentPlayer && !unit.hasActed) {
                this.selectUnit(unit);
            } else if (unit && unit.owner === this.state.currentPlayer && unit.hasActed) {
                this.logGameEvent('⚠️ This unit has already acted this turn');
            } else if (unit && unit.owner !== this.state.currentPlayer) {
                this.logGameEvent('⚠️ You can only select your own units');
            }
        } else {
            this.deselectUnit();
        }
    }

    selectUnit(unit) {
        // Clear previous selection
        this.deselectUnit();

        // Set new selection
        this.state.selectedUnit = unit;
        
        // Highlight selected unit
        const cell = document.getElementById(`cell-${unit.position.row}-${unit.position.col}`);
        cell.classList.add('selected');

        // Enable action buttons if unit hasn't acted
        if (!unit.hasActed) {
            this.enableActionButtons();
        }

        // Update unit info display
        this.updateUnitInfoDisplay(unit);

        this.logGameEvent(`🎯 Selected ${unit.type} at position (${unit.position.row + 1}, ${unit.position.col + 1})`);
    }

    deselectUnit() {
        if (this.state.selectedUnit) {
            // Remove highlight from previously selected unit
            const cell = document.getElementById(`cell-${this.state.selectedUnit.position.row}-${this.state.selectedUnit.position.col}`);
            if (cell) cell.classList.remove('selected');
        }

        // Clear selection
        this.state.selectedUnit = null;

        // Disable action buttons
        this.disableActionButtons();

        // Clear unit info display
        this.clearUnitInfoDisplay();
    }

    updateUnitInfoDisplay(unit) {
        this.unitInfo.innerHTML = `
            <div class="unit-info-header">
                <span class="unit-type">${unit.type.toUpperCase()}</span>
                <span class="unit-owner">${unit.owner === 'player1' ? '🟦' : '🟥'}</span>
            </div>
            <div class="unit-stats">
                <div>HP: ${unit.hp}/${unit.maxHp}</div>
                <div>ATK: ${unit.attack}</div>
                <div>DEF: ${unit.defense}</div>
                <div>Range: ${unit.attackRange}</div>
            </div>
            <div class="unit-position">
                Position: (${unit.position.row + 1}, ${unit.position.col + 1})
            </div>
        `;
    }

    clearUnitInfoDisplay() {
        this.unitInfo.innerHTML = '<div class="unit-info-placeholder">Select a unit to view info</div>';
    }

    enableActionButtons() {
        this.actionButtons.forEach(btn => {
            if (btn.id !== 'roll-dice' && btn.id !== 'endTurnBtn') {
                btn.disabled = false;
                btn.classList.remove('disabled');
            }
        });
    }

    disableActionButtons() {
        this.actionButtons.forEach(btn => {
            if (btn.id !== 'roll-dice' && btn.id !== 'endTurnBtn') {
                btn.disabled = true;
                btn.classList.add('disabled');
            }
        });
    }

    async handleDiceRoll() {
        if (!this.state.isSetupPhase) return;

        // Disable roll button during animation
        this.rollDiceBtn.disabled = true;

        // Animate dice roll
        await this.animateDiceRoll();

        if (this.state.diceRolls.player1 === null) {
            // Player 1's turn to roll
            this.state.diceRolls.player1 = Math.floor(Math.random() * 6) + 1;
            this.showDiceFace(this.state.diceRolls.player1);
            this.logGameEvent(`🎲 Player 1 rolls a ${this.state.diceRolls.player1}`);
            this.updateGameStatus('Player 2\'s turn to roll');
        } else {
            // Player 2's turn to roll
            this.state.diceRolls.player2 = Math.floor(Math.random() * 6) + 1;
            this.showDiceFace(this.state.diceRolls.player2);
            this.logGameEvent(`🎲 Player 2 rolls a ${this.state.diceRolls.player2}`);

            // Determine starting player
            if (this.state.diceRolls.player1 === this.state.diceRolls.player2) {
                // Tie - reset rolls
                this.logGameEvent('🎯 Tie! Roll again...');
                this.state.diceRolls.player1 = null;
                this.state.diceRolls.player2 = null;
                this.rollDiceBtn.disabled = false;
                return;
            }

            // We have a winner - higher number wins
            this.state.currentPlayer = this.state.diceRolls.player1 > this.state.diceRolls.player2 ? 'player1' : 'player2';
            const winnerNumber = this.state.currentPlayer === 'player1' ? '1' : '2';
            const winnerRoll = this.state.currentPlayer === 'player1' ? this.state.diceRolls.player1 : this.state.diceRolls.player2;
            const loserRoll = this.state.currentPlayer === 'player1' ? this.state.diceRolls.player2 : this.state.diceRolls.player1;
            this.logGameEvent(`🏁 Player ${winnerNumber} wins with ${winnerRoll} vs ${loserRoll} and starts the game!`);
            
            // Start the game
            this.startGame();
        }

        this.rollDiceBtn.disabled = false;
    }

    async animateDiceRoll() {
        this.diceElement.classList.add('rolling');
        for (let i = 0; i < 10; i++) {
            const randomFace = Math.floor(Math.random() * 6) + 1;
            this.showDiceFace(randomFace);
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        this.diceElement.classList.remove('rolling');
    }

    showDiceFace(number) {
        // Clear existing content
        this.diceElement.innerHTML = '';
        
        // Create and add dice image
        const img = document.createElement('img');
        img.src = this.diceImages[number - 1];
        img.alt = `Dice face showing ${number}`;
        img.style.width = '100%';
        img.style.height = '100%';
        
        // Add error handling for image loading
        img.onerror = () => {
            console.error(`Failed to load dice image: ${img.src}`);
            this.diceElement.textContent = number; // Fallback to number if image fails
        };
        
        this.diceElement.appendChild(img);
    }

    startGame() {
        this.state.isSetupPhase = false;
        this.state.currentPhase = 'action';
        this.state.turnCount = 1;
        
        // Show action buttons and unit info display
        this.showActionButtons();
        this.unitInfo.classList.add('show');
        
        this.disableActionButtons(); // Start with disabled buttons until unit is selected
        this.updateTurnDisplay();
        this.clearUnitInfoDisplay();
    }

    updateTurnDisplay() {
        const playerSymbol = this.state.currentPlayer === 'player1' ? '🟦' : '🟥';
        const playerNumber = this.state.currentPlayer === 'player1' ? '1' : '2';
        const phaseText = this.state.currentPhase.charAt(0).toUpperCase() + this.state.currentPhase.slice(1);
        
        this.updateGameStatus(`${playerSymbol} Player ${playerNumber}'s Turn - ${phaseText} Phase`);
    }

    handleMove() {
        if (!this.state.selectedUnit) return;
        
        const unit = this.state.selectedUnit;
        if (unit.hasActed) {
            this.logGameEvent('⚠️ This unit has already acted this turn');
            return;
        }

        // Movement will be handled by MovementManager
        window.movementManager.startMovement(unit);
    }

    handleAttack() {
        if (!this.state.selectedUnit) return;
        
        const unit = this.state.selectedUnit;
        if (unit.hasActed) {
            this.logGameEvent('⚠️ This unit has already acted this turn');
            return;
        }

        // Try to start attack mode
        if (!window.combatManager.startAttack(unit)) {
            return;
        }

        // Enable attack mode
        this.state.currentPhase = 'attack';
        
        // Remove normal unit selection listener temporarily
        document.querySelectorAll('.grid-cell').forEach(cell => {
            cell.removeEventListener('click', this.handleUnitSelection);
        });
        
        // Add click listener for target selection
        const handleTargetSelection = (e) => {
            const targetCell = e.currentTarget;
            const targetUnitId = targetCell.dataset.unitId;
            
            if (targetUnitId) {
                const targetUnit = window.unitManager.getUnitById(targetUnitId);
                if (targetUnit && targetUnit.owner !== unit.owner) {
                    // Check if target is in range (valid target will be highlighted)
                    if (targetCell.classList.contains('valid-target')) {
                        // Perform attack
                        window.combatManager.performAttack(unit, targetUnit);
                        
                        // Mark unit as acted
                        unit.hasActed = true;
                        this.disableActionButtons();
                        
                        // Clean up
                        window.combatManager.removeAttackRange();
                        this.removeTargetSelectionListeners(handleTargetSelection);
                        this.state.currentPhase = 'action';
                        
                        // Restore normal unit selection listener
                        document.querySelectorAll('.grid-cell').forEach(cell => {
                            cell.addEventListener('click', (e) => this.handleUnitSelection(e));
                        });
                    } else {
                        this.logGameEvent('⚠️ Target is out of range');
                    }
                } else if (targetUnit && targetUnit.owner === unit.owner) {
                    this.logGameEvent('⚠️ Cannot attack your own units');
                }
            }
        };

        // Add listeners to all cells
        document.querySelectorAll('.grid-cell').forEach(cell => {
            cell.addEventListener('click', handleTargetSelection);
        });
    }

    handleDefend() {
        if (!this.state.selectedUnit) {
            this.logGameEvent('⚠️ No unit selected');
            return;
        }

        const unit = this.state.selectedUnit;
        
        // Check if unit can act
        if (unit.hasActed) {
            this.logGameEvent('⚠️ This unit has already acted this turn');
            return;
        }

        // Check if unit belongs to current player
        if (unit.owner !== this.state.currentPlayer) {
            this.logGameEvent('⚠️ You can only defend with your own units');
            return;
        }

        // Start defense mode
        if (window.defenseManager.startDefense(unit)) {
            // Update UI
            this.updateUnitDisplay(unit);
            
            // Disable action buttons for this unit
            this.disableActionButtons();
            
            // Deselect the unit
            const cell = document.getElementById(`cell-${unit.position.row}-${unit.position.col}`);
            if (cell) {
                cell.classList.remove('selected');
            }
            this.state.selectedUnit = null;
            
            // Log the action with defense class for styling
            const logEntry = document.createElement('div');
            logEntry.className = 'log-entry defense';
            logEntry.textContent = `🛡️ ${unit.type} takes a defensive stance`;
            this.logContent.appendChild(logEntry);
            this.logContent.scrollTop = this.logContent.scrollHeight;
        }
    }

    updateUnitDisplay(unit) {
        // Update unit info if it's the selected unit
        if (this.state.selectedUnit && this.state.selectedUnit.id === unit.id) {
            this.updateUnitInfoDisplay(unit);
        }

        // Update unit in the player panel
        const unitDisplays = document.querySelectorAll('.unit-display');
        unitDisplays.forEach(display => {
            if (display.dataset.unitId === unit.id) {
                // Update defense value if needed
                const defenseElement = display.querySelector('.unit-defense');
                if (defenseElement) {
                    defenseElement.textContent = `DEF: ${unit.defense}`;
                }
                
                // Add visual indicator for defending state
                if (unit.temporaryDefense) {
                    display.classList.add('defending');
                } else {
                    display.classList.remove('defending');
                }
            }
        });
    }

    handlePower() {
        if (!this.state.selectedUnit) {
            this.logGameEvent('⚠️ No unit selected');
            return;
        }

        const unit = this.state.selectedUnit;
        
        // Check if unit can act
        if (unit.hasActed) {
            this.logGameEvent('⚠️ This unit has already acted this turn');
            return;
        }

        // Check if unit belongs to current player
        if (unit.owner !== this.state.currentPlayer) {
            this.logGameEvent('⚠️ You can only use powers with your own units');
            return;
        }

        // Try to start power selection
        if (window.powerManager.startPowerSelection(unit)) {
            this.showPowerSelectionUI(unit);
        }
    }

    showPowerSelectionUI(unit) {
        // Remove any existing power selection modal
        const existingModal = document.querySelector('.power-selection-modal');
        if (existingModal) existingModal.remove();

        // Create power selection modal
        const modal = document.createElement('div');
        modal.className = 'power-selection-modal';
        
        // Get available powers for unit type
        const powers = window.powerManager.powers[unit.type.toLowerCase()];
        
        // Create power buttons
        const powersList = document.createElement('div');
        powersList.className = 'powers-list';
        
        powers.forEach(power => {
            const powerBtn = document.createElement('button');
            powerBtn.className = 'power-button';
            const cooldownKey = `${unit.id}_${power.name}`;
            const cooldown = window.powerManager.cooldowns.get(cooldownKey) || 0;
            
            powerBtn.innerHTML = `
                <div class="power-name">${power.name}</div>
                <div class="power-description">${power.description}</div>
                ${cooldown > 0 ? `<div class="power-cooldown">Recharge: ${cooldown} tour(s)</div>` : ''}
            `;
            
            powerBtn.disabled = cooldown > 0;
            
            powerBtn.addEventListener('click', () => {
                this.handlePowerSelection(unit, power);
                modal.remove();
            });
            
            powersList.appendChild(powerBtn);
        });
        
        modal.appendChild(powersList);
        
        // Add close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'close-button';
        closeBtn.textContent = '✕';
        closeBtn.addEventListener('click', () => modal.remove());
        modal.appendChild(closeBtn);
        
        document.body.appendChild(modal);
    }

    handlePowerSelection(unit, power) {
        // For powers that need a target (like Mage's Explosion de Feu)
        if (unit.type.toLowerCase() === 'mage') {
            this.state.currentPhase = 'power';
            this.logGameEvent(`✨ Select target for ${power.name}`);
            
            // Show valid target cells
            this.showPowerTargets(unit, power);
            
            // Add click listener for target selection
            const handleTargetSelection = (e) => {
                const targetCell = e.currentTarget;
                const targetPosition = {
                    row: parseInt(targetCell.dataset.row),
                    col: parseInt(targetCell.dataset.col)
                };
                
                // Try to use the power
                if (window.powerManager.usePower(unit, power.name, targetPosition)) {
                    // Clean up
                    this.removePowerTargets();
                    this.removeTargetSelectionListeners(handleTargetSelection);
                    this.state.currentPhase = 'action';
                    this.deselectUnit();
                }
            };
            
            // Add listeners to all cells
            document.querySelectorAll('.grid-cell').forEach(cell => {
                cell.addEventListener('click', handleTargetSelection);
            });
        } else {
            // For non-targeted powers (Warrior's Contre-Attaque and Archer's Tir Précis)
            if (window.powerManager.usePower(unit, power.name)) {
                this.deselectUnit();
            }
        }
    }

    showPowerTargets(unit, power) {
        // Remove any existing highlights
        this.removePowerTargets();
        
        // For Mage's AoE power
        if (unit.type.toLowerCase() === 'mage') {
            // Show cells within range
            for (let row = 0; row < 10; row++) {
                for (let col = 0; col < 10; col++) {
                    const distance = Math.abs(row - unit.position.row) + 
                                   Math.abs(col - unit.position.col);
                    
                    if (distance <= power.range) {
                        const cell = document.getElementById(`cell-${row}-${col}`);
                        if (cell) {
                            cell.classList.add('valid-target');
                            
                            // Add mouseover effect to show AoE preview
                            cell.addEventListener('mouseover', () => this.showAoEPreview({ row, col }, power.aoeRange));
                            cell.addEventListener('mouseout', () => this.removeAoEPreview());
                        }
                    }
                }
            }
        }
    }

    showAoEPreview(center, range) {
        // Remove any existing preview
        this.removeAoEPreview();
        
        // Show affected area
        for (let row = center.row - range; row <= center.row + range; row++) {
            for (let col = center.col - range; col <= center.col + range; col++) {
                if (row >= 0 && row < 10 && col >= 0 && col < 10) {
                    const cell = document.getElementById(`cell-${row}-${col}`);
                    if (cell) {
                        cell.classList.add('aoe-preview');
                    }
                }
            }
        }
    }

    removeAoEPreview() {
        document.querySelectorAll('.aoe-preview').forEach(cell => {
            cell.classList.remove('aoe-preview');
        });
    }

    removePowerTargets() {
        document.querySelectorAll('.valid-target').forEach(cell => {
            cell.classList.remove('valid-target');
            
            // Remove AoE preview listeners
            cell.removeEventListener('mouseover', this.showAoEPreview);
            cell.removeEventListener('mouseout', this.removeAoEPreview);
        });
    }

    removeTargetSelectionListeners(listener) {
        document.querySelectorAll('.grid-cell').forEach(cell => {
            cell.removeEventListener('click', listener);
        });
    }

    endTurn() {
        // Reset defense states for current player
        window.defenseManager.resetDefenseState(this.state.currentPlayer);
        
        // Switch players
        this.state.currentPlayer = this.state.currentPlayer === 'player1' ? 'player2' : 'player1';
        
        // Reset unit states for new player
        this.resetUnitsStatus();
        
        // Check for game end
        if (this.checkGameEnd()) {
            return; // Don't continue turn if game is over
        }
        
        // Update UI
        this.updateGameStatus(`Player ${this.state.currentPlayer === 'player1' ? '1' : '2'}'s Turn`);
        this.enableActionButtons();
        
        // Clear any selections
        if (this.state.selectedUnit) {
            const cell = document.getElementById(`cell-${this.state.selectedUnit.position.row}-${this.state.selectedUnit.position.col}`);
            if (cell) {
                cell.classList.remove('selected');
            }
            this.state.selectedUnit = null;
        }
        
        this.logGameEvent(`🔄 Turn ended. Player ${this.state.currentPlayer === 'player1' ? '1' : '2'}'s turn`);
    }

    /**
     * Check if the game has ended
     * @returns {boolean} Whether the game has ended
     */
    checkGameEnd() {
        const player1Units = window.unitManager.units.player1.length;
        const player2Units = window.unitManager.units.player2.length;
        
        if (player1Units === 0 || player2Units === 0) {
            const winner = player1Units > 0 ? '1' : '2';
            this.handleGameOver(winner);
            return true;
        }
        
        return false;
    }

    /**
     * Handle game over state
     * @param {string} winner - The winning player number
     */
    handleGameOver(winner) {
        // Update game status with victory message
        const victoryMessage = `🏆 Player ${winner} is Victorious! 🏆`;
        this.updateGameStatus(victoryMessage);
        
        // Create victory overlay
        const overlay = document.createElement('div');
        overlay.className = 'victory-overlay';
        
        // Add victory content
        overlay.innerHTML = `
            <div class="victory-content">
                <h2 class="victory-title">${victoryMessage}</h2>
                <div class="victory-stats">
                    <p>Remaining Units: ${window.unitManager.units[`player${winner}`].length}</p>
                    <p>Turn Count: ${this.state.turnCount}</p>
                </div>
                <div class="victory-buttons">
                    <button id="restartGame" class="victory-button">New Game</button>
                    <button id="returnToMenu" class="victory-button">Return to Menu</button>
                </div>
            </div>
        `;
        
        // Add to document
        document.body.appendChild(overlay);
        
        // Add button listeners
        document.getElementById('restartGame').addEventListener('click', () => {
            window.location.reload();
        });
        
        document.getElementById('returnToMenu').addEventListener('click', () => {
            window.location.href = '../index.html';
        });
        
        // Disable all game controls
        this.disableAllControls();
        
        // Log victory
        this.logGameEvent(`🎊 Game Over - Player ${winner} wins! 🎊`, 'victory');
    }

    /**
     * Disable all game controls
     */
    disableAllControls() {
        // Disable all action buttons
        this.actionButtons.forEach(btn => {
            btn.disabled = true;
            btn.classList.add('disabled');
        });
        
        // Remove event listeners from grid
        document.querySelectorAll('.grid-cell').forEach(cell => {
            cell.removeEventListener('click', this.handleUnitSelection);
            cell.style.cursor = 'default';
        });
        
        // Add game-over class to game container
        document.querySelector('.game-container').classList.add('game-over');
    }

    resetUnitsStatus() {
        const currentUnits = window.unitManager.units[this.state.currentPlayer];
        currentUnits.forEach(unit => {
            // Reset action flags
            unit.hasActed = false;
            unit.hasMoved = false;

            // Reset any temporary buffs or states
            if (unit.temporaryDefense) {
                unit.defense = unit.baseDefense;
                unit.temporaryDefense = false;
            }
        });
    }

    updateGameStatus(message) {
        this.gameStatus.textContent = message;
    }

    logGameEvent(message) {
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        logEntry.textContent = message;
        this.logContent.appendChild(logEntry);
        this.logContent.scrollTop = this.logContent.scrollHeight;
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

        // Start the actual game
        window.turnManager.state.isSetupPhase = true;
        window.turnManager.initializeGame();
        window.turnManager.logGameEvent('🎮 Unit placement completed - Roll dice to start the game!');
    }
}

// Initialize turn manager when document is ready
document.addEventListener('DOMContentLoaded', () => {
    window.turnManager = new TurnManager();
}); 