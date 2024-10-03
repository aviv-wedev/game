document.addEventListener("DOMContentLoaded", () => {
  const BASE_SPEED = 3.5; // Base speed
  let speedMultiplier = 1; // Speed multiplier
  const PLAYER_FIGURE = 20; // Player size
  const DOT_SIZE = 10; // Size of green/red dots
  const NUM_DOTS = 5; // Number of green/red dots to generate

  const player = document.querySelector(".player");
  let x = 0;
  let y = 0;

  const gameCanvas = document.getElementById("game-canvas");
  let offsetHeight = gameCanvas.clientHeight;
  let offsetWidth = gameCanvas.clientWidth;

  let movement = {
    up: false,
    down: false,
    left: false,
    right: false
  };

  let dots = [];

  // Initialize player position
  player.style.left = `${x}px`;
  player.style.top = `${y}px`;

  // Function to generate green and red dots randomly on the canvas
  function generateDots() {
    for (let i = 0; i < NUM_DOTS; i++) {
      const dot = {
        x: Math.random() * (offsetWidth - DOT_SIZE),
        y: Math.random() * (offsetHeight - DOT_SIZE),
        color: Math.random() > 0.5 ? "green" : "red" // Randomly assign color
      };
      dots.push(dot);
      const dotElement = document.createElement("div");
      dotElement.className = "dot";
      dotElement.style.backgroundColor = dot.color;
      dotElement.style.width = `${DOT_SIZE}px`;
      dotElement.style.height = `${DOT_SIZE}px`;
      dotElement.style.position = "absolute";
      dotElement.style.left = `${dot.x}px`;
      dotElement.style.top = `${dot.y}px`;
      gameCanvas.appendChild(dotElement);
    }
  }

  // Function to check for collision between player and dots
  function checkCollision() {
    dots.forEach((dot, index) => {
      if (x < dot.x + DOT_SIZE && x + PLAYER_FIGURE > dot.x && y < dot.y + DOT_SIZE && y + PLAYER_FIGURE > dot.y) {
        // If player collides with a green dot (speed boost)
        if (dot.color === "green") {
          speedMultiplier = 1.5; // Apply speed boost
        }
        // If player collides with a red dot (speed decrease)
        else if (dot.color === "red") {
          speedMultiplier = 0.5; // Apply speed decrease
        }
        // Remove the dot from the canvas after collision
        dots.splice(index, 1);
        gameCanvas.removeChild(gameCanvas.getElementsByClassName("dot")[index]);
      }
    });
  }

  // Update player position smoothly
  function movePlayer() {
    // Update canvas dimensions in case they change
    offsetHeight = gameCanvas.clientHeight;
    offsetWidth = gameCanvas.clientWidth;

    let playerSpeed = BASE_SPEED * speedMultiplier;

    if (movement.up && y > 0) {
      y -= playerSpeed;
    }
    if (movement.down && y + PLAYER_FIGURE < offsetHeight) {
      y += playerSpeed;
    } else if (movement.down) {
      y = offsetHeight - PLAYER_FIGURE;
    }
    if (movement.left && x > 0) {
      x -= playerSpeed;
    }
    if (movement.right && x + PLAYER_FIGURE < offsetWidth) {
      x += playerSpeed;
    } else if (movement.right) {
      x = offsetWidth - PLAYER_FIGURE;
    }

    // Check for collisions with dots
    checkCollision();

    // Update player position
    player.style.left = `${x}px`;
    player.style.top = `${y}px`;

    requestAnimationFrame(movePlayer);
  }

  // Event listeners for keydown and keyup
  document.addEventListener("keydown", (event) => {
    switch (event.key) {
      case "ArrowUp":
      case "w":
        movement.up = true;
        break;
      case "ArrowDown":
      case "s":
        movement.down = true;
        break;
      case "ArrowLeft":
      case "a":
        movement.left = true;
        break;
      case "ArrowRight":
      case "d":
        movement.right = true;
        break;
    }
  });

  document.addEventListener("keyup", (event) => {
    switch (event.key) {
      case "ArrowUp":
      case "w":
        movement.up = false;
        break;
      case "ArrowDown":
      case "s":
        movement.down = false;
        break;
      case "ArrowLeft":
      case "a":
        movement.left = false;
        break;
      case "ArrowRight":
      case "d":
        movement.right = false;
        break;
    }
  });

  // Generate green and red dots on the canvas
  generateDots();

  // Start the animation loop
  requestAnimationFrame(movePlayer);
});
