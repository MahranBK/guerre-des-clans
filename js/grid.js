document.addEventListener('DOMContentLoaded', () => {

    // grid constants initialization
    const GRID_SIZE = 10; // nb of grid columns 
    const PLAYER1_ZONE = 3; // Top 3 rows
    const NEUTRAL_ZONE = 4; // Middle 4 rows

    const clickSound = new Audio("../assets/audio/effects/click.mp3");
    clickSound.volume = 0.2;

    // add click sound effects to buttons
    const interactiveElements = document.querySelectorAll("button");
    interactiveElements.forEach((element) => {
        element.addEventListener("click", () => {
            clickSound.currentTime = 0;
            clickSound.play();
        });
    });

    const battlefield = document.getElementById('battlefield-grid');
    battlefield.innerHTML = ''; // clear any existing content
    
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
            
            // add zone classes
            if (row < PLAYER1_ZONE) {
                cell.classList.add('player1-zone');
            } else if (row < PLAYER1_ZONE + NEUTRAL_ZONE) {
                cell.classList.add('neutral-zone');
            } else {
                cell.classList.add('player2-zone');
            }
            
            // add coordinates attributes to cell for easy access
            cell.dataset.row = row;
            cell.dataset.col = col;
            
            battlefield.appendChild(cell);
        }
    }
});