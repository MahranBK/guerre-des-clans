// Grid initialization logic for War of the Clans
const GRID_SIZE = 10;
const PLAYER1_ZONE = 3; // Top 3 rows
const NEUTRAL_ZONE = 4; // Middle 4 rows
const PLAYER2_ZONE = 3; // Bottom 3 rows

function initializeGrid() {
    const battlefield = document.getElementById('battlefield-grid');
    battlefield.innerHTML = ''; // Clear any existing content
    
    // Add CSS Grid properties
    battlefield.style.display = 'grid';
    battlefield.style.gridTemplateColumns = `repeat(${GRID_SIZE}, 1fr)`;
    battlefield.style.gap = '2px';
    
    // Create cells
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            const cell = document.createElement('div');
            cell.id = `cell-${row}-${col}`;
            cell.className = 'grid-cell';
            
            // Add zone classes
            if (row < PLAYER1_ZONE) {
                cell.classList.add('player1-zone');
            } else if (row < PLAYER1_ZONE + NEUTRAL_ZONE) {
                cell.classList.add('neutral-zone');
            } else {
                cell.classList.add('player2-zone');
            }
            
            // Add coordinates attribute for easier access
            cell.dataset.row = row;
            cell.dataset.col = col;
            
            battlefield.appendChild(cell);
        }
    }
}

// Initialize grid when document is ready
document.addEventListener('DOMContentLoaded', initializeGrid); 