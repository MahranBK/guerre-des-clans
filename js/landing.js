// to ensure all js code only runs after entire HTML doc has been fully loaded
document.addEventListener("DOMContentLoaded", () => {
  const enterGameBtn = document.getElementById("enterGameBtn");
  const toggleMusicBtn = document.getElementById("toggleMusic");
  const startGameBtn = document.getElementById("startGameBtn");
  const rulesBtn = document.getElementById("rulesBtn");
  const rulesModal = document.getElementById("rulesModal");
  const closeModal = document.querySelector(".close-modal");
  const player1Clans = document.querySelectorAll("#player1Clans .clan-card");
  const player2Clans = document.querySelectorAll("#player2Clans .clan-card");
  const introScreen = document.querySelector(".intro-screen");
  const landingContainer = document.querySelector(".landing-container");

  // Initiliaze variables
  let player1Clan = null;
  let player2Clan = null;
  let isMusicPlaying = false;

  // Music Control
  let backgroundMusic = new Audio("assets/audio/music/bg_music.mp3");
  backgroundMusic.loop = true;
  backgroundMusic.volume = 0.4;

  function toggleMusic() {
    if (isMusicPlaying) {
      backgroundMusic.pause();
      isMusicPlaying = false;
      toggleMusicBtn.textContent = '🔈';
      toggleMusicBtn.classList.add('muted');
    } else {
      backgroundMusic.play().catch(error => {
        console.log("Music playback failed:", error);
      });
      isMusicPlaying = true;
      toggleMusicBtn.textContent = '🔊';
      toggleMusicBtn.classList.remove('muted');
    }
  }

  // Initialize music button
  toggleMusicBtn.addEventListener('click', toggleMusic);

  // Sound effects
  const hoverSound = new Audio(
    "./assets/audio/effects/hoverOver.mp3"
  );
  hoverSound.volume = 0.25;

  const clickSound = new Audio(
    "./assets/audio/effects/click.mp3"
  );
  clickSound.volume = 0.3;

  // Enter game button
  enterGameBtn.addEventListener("click", () => {
    clickSound.play();
    introScreen.style.display = "none";
    landingContainer.style.display = "flex";
    if (!isMusicPlaying) {
      backgroundMusic.play().catch(error => {
        console.log("Music playback failed:", error);
      });
      toggleMusicBtn.textContent = "🔊";
      isMusicPlaying = true;
    }
  });

  // Player 1 clan selection
  player1Clans.forEach((card) => {
    card.addEventListener("click", () => {
      clickSound.play();
      player1Clans.forEach((c) => c.classList.remove("selected"));
      card.classList.add("selected");
      // assign chosen card data-clan attribute value to player1Clan
      player1Clan = card.dataset.clan;
    });
  });

  // Player 2 clan selection
  player2Clans.forEach((card) => {
    card.addEventListener("click", () => {
      clickSound.play();
      player2Clans.forEach((c) => c.classList.remove("selected"));
      card.classList.add("selected");
      // assign chosen card data-clan attribute value to player1Clan
      player2Clan = card.dataset.clan;
    });
  });

  // Rules modal
  rulesBtn.addEventListener("click", () => {
    clickSound.play();
    rulesModal.style.display = "block";
  });

  closeModal.addEventListener("click", () => {
    clickSound.play();
    rulesModal.style.display = "none";
  });

  // hide the rulesModal if clicking outside the modal-content
  window.addEventListener("click", (e) => {
    if (e.target === rulesModal) {
      rulesModal.style.display = "none";
    }
  });

  // Start game
  startGameBtn.addEventListener("click", () => {
    if (!player1Clan || !player2Clan) {
      alert("Both players must select their clans before starting the game!");
      return;
    }

    clickSound.play();
    // store chosen clans of both players into local storage of the browser
    localStorage.setItem("player1Clan", player1Clan);
    localStorage.setItem("player2Clan", player2Clan);
    // redirect to game page 
    window.location.href = "pages/game.html";
  });

  // add hover sound effects to buttons & clan cards
  const interactiveElements = document.querySelectorAll("button, .clan-card");
  interactiveElements.forEach((element) => {
    element.addEventListener("mouseenter", () => {
      hoverSound.currentTime = 0;
      hoverSound.play();
    });
  });

  // start bg music when user interacts with the page
  document.addEventListener(
    "click",
    () => {
      if (!isMusicPlaying) {
        backgroundMusic.play().catch(error => {
          console.log("Music playback failed:", error);
        });
        toggleMusicBtn.textContent = "🔊";
        isMusicPlaying = true;
      }
    },
    { once: true } // remove event listener after first time being triggered
  );
});

