# Guerre des Clans - Fantasy Turn-Based Strategy Game

## Overview
Guerre des Clans is an engaging turn-based strategy game where two players command their armies of warriors, archers, and mages in a battle for supremacy. Set in a medieval fantasy world, the game combines tactical positioning, special abilities, and strategic decision-making.

## Game Features

### Units
Each player commands three types of units:
- **🗡️ Warrior**: Close-combat specialist with high defense and counter-attack abilities
- **🏹 Archer**: Ranged unit that excels at long-distance combat with precision shots
- **🔮 Mage**: Powerful spellcaster capable of dealing area-of-effect damage

### Game Flow
1. **Setup Phase**
   - Players roll dice to determine who goes first
   - Higher roll wins and starts the game

2. **Main Game Phase**
   - Players take turns moving and commanding their units
   - Each unit can perform one action per turn
   - Turn ends when player clicks "End Turn"
   - Game continues until one player loses all units

## Controls and Actions

### Action Buttons
- **Move** 🚶: Move selected unit to a valid position
  - Units can move within their movement range
  - Cannot move through occupied cells
  
- **Attack** ⚔️: Attack enemy units
  - Each unit type has different attack ranges
  - Warriors: Close range (1 cell)
  - Archers: Long range (2-4 cells)
  - Mages: Medium range (2-3 cells)

- **Defend** 🛡️: Take defensive stance
  - Increases unit's defense
  - Defense bonus stacks with nearby defending allies
  - Lasts until the unit's next turn
  
- **Power** ✨: Use unit's special ability
  - Each unit type has a unique power:
    * Warrior: "Contre-Attaque" - Reflects 50% damage back to attacker
    * Archer: "Tir Précis" - Ignores 50% of target's defense, improved accuracy
    * Mage: "Explosion de Feu" - Deals damage in a 3x3 area
  - Powers have cooldowns before they can be used again

- **End Turn** ⏭️: Finish current player's turn
  - Switches control to the other player
  - Resets action states for the next player's units

### Unit States and Visual Indicators
- 🔵 Blue Border: Player 1's units
- 🔴 Red Border: Player 2's units
- 🛡️ Blue Glow: Unit in defensive stance
- ✓ Green Checkmark: Unit has acted this turn
- 💫 Special Effects: Show active powers and abilities

## Victory Conditions
- Game ends when all units of one player are defeated
- Victory screen shows:
  * Winning player
  * Remaining units
  * Total turns taken
- Options to start new game or return to menu

## Tips and Strategies
1. Position warriors to protect weaker units
2. Use archer's range to attack from safe positions
3. Time your defensive stances to maximize protection
4. Coordinate unit positions for overlapping defense bonuses
5. Save powerful abilities for critical moments
6. Watch for opportunities to catch multiple enemies in mage's area attack

## Technical Requirements
- Modern web browser with JavaScript enabled
- Recommended screen resolution: 1280x720 or higher
- Stable internet connection for asset loading

## Credits
Guerre des Clans is a fantasy turn-based strategy game developed with HTML5, CSS3, and JavaScript. The game features medieval-themed graphics and animations for an immersive gaming experience.

## Technical Implementation Details

### Action System Architecture
The game implements a state-based action system where each action (Attack, Defend, Move, Power) is managed through event handlers and state controllers. Here's how each action works behind the scenes:

#### Move Action Logic
- The system maintains a grid-based coordinate system where each cell has x,y coordinates
- When Move is selected:
  1. The system calculates valid movement tiles based on:
     - Unit's movement range
     - Terrain obstacles
     - Other unit positions
  2. Valid cells are highlighted using a pathfinding algorithm
  3. Movement validation checks:
     - Ensures destination is within range
     - Verifies path is not blocked
     - Confirms unit hasn't moved this turn
  4. After movement, unit's position is updated in the game state

#### Attack Action Implementation
- Attack logic uses a range-based targeting system:
  1. Target validation:
     - Checks if target is within unit's attack range
     - Verifies line of sight (for archers)
     - Confirms target is an enemy unit
  2. Damage calculation considers:
     - Base damage of attacking unit
     - Target's defense value
     - Random variance (±10% of base damage)
     - Critical hit chance (15% chance for 1.5x damage)
     - Defensive stance multipliers
  3. Post-attack processing:
     - Updates target's health
     - Triggers any counter-attack mechanics
     - Updates UI to reflect changes
     - Marks attacking unit as "acted"

#### Defense System Mechanics
- Defensive stance implementation:
  1. When activated:
     - Unit's defense value increases by 50%
     - Adjacent friendly units get 25% defense bonus
     - System tracks defensive buff duration
  2. Defense calculation:
     - Base defense + Stance bonus + Adjacent allies bonus
     - Maximum stack of 3 adjacent defensive bonuses
  3. State management:
     - Defensive buffs persist until unit's next turn
     - System tracks which units are in defensive stance
     - Updates visual indicators accordingly

#### Special Power System
- Each unit type has unique power implementation:
  1. Warrior's Contre-Attaque:
     - System stores damage received
     - Calculates 50% reflection value
     - Applies reflected damage to attacker
     - Tracks cooldown (3 turns)
  
  2. Archer's Tir Précis:
     - Temporarily modifies damage calculation formula
     - Bypasses 50% of target's defense
     - Increases hit chance to 100%
     - Manages 4-turn cooldown
  
  3. Mage's Explosion de Feu:
     - Area damage calculation:
       * Primary target: 100% damage
       * Adjacent cells: 75% damage
       * Diagonal cells: 50% damage
     - Handles multiple target damage application
     - 5-turn cooldown management

#### Turn Management System
- Turn controller manages:
  1. Action state tracking:
     - Which units have acted
     - Available actions per unit
     - Cooldown timers
  2. Turn transition processing:
     - Resets unit action flags
     - Updates cooldowns
     - Removes expired buffs
     - Triggers turn-based effects
  3. Victory condition checking:
     - Scans for defeated units
     - Validates win conditions
     - Triggers game end if conditions met

### State Management
- The game uses a centralized state manager that:
  1. Tracks game state:
     - Unit positions
     - Health values
     - Active effects
     - Turn counter
  2. Handles state updates:
     - Validates actions
     - Updates unit states
     - Manages turn transitions
  3. Maintains action history for:
     - Undo functionality
     - Combat log
     - Game statistics

### Event System
- The game implements an event-driven architecture:
  1. Action events:
     - Movement completion
     - Attack resolution
     - Ability activation
  2. State change events:
     - Unit health updates
     - Position changes
     - Buff application/removal
  3. Turn events:
     - Turn start/end
     - Phase transitions
     - Game end conditions

This technical architecture ensures smooth gameplay flow while maintaining game balance and proper rule enforcement. Each action and state change is validated and processed through multiple layers of logic to ensure game integrity and consistent behavior. 