document.addEventListener("DOMContentLoaded", () => {
  const BASE_SPEED = 3.5;
  const MAX_SPEED = 7;
  const MIN_SPEED = 1.5;
  let gameTimer = null;
  let timeElapsed = 0; // Time in seconds
  let enemySpeed = 1; // Starting speed of the chasing enemy

  const PLAYER_FIGURE = 20;
  const DOT_SIZE = 10;
  const MIN_DOTS = 2;
  const DECAY_TIME = 4500;
  const ENEMY_SPEED_INCREASE_RATE = 0.02;
  const MAX_ENEMY_SPEED = 2.5; // Max speed of the chasing enemy
  const SHOOT_INTERVAL = 7000; // Interval for sentry shooting
  const PROJECTILE_SIZE = 10;
  const COLLISION_THRESHOLD = 20;

  let game = null; // Game instance
  let gameStarted = false;

  // Timer for tracking how long the game has been running
  function startTimer() {
    if (gameTimer) {
      clearInterval(gameTimer);
    }

    gameTimer = setInterval(() => {
      timeElapsed++;

      // Calculate minutes and seconds
      const minutes = Math.floor(timeElapsed / 60);
      const seconds = timeElapsed % 60;

      // Format the minutes and seconds to always show two digits (e.g., 02:05)
      const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
      const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds;

      // Update the timer display
      document.getElementById("timer-display").innerText = `Time: ${formattedMinutes}:${formattedSeconds}`;
    }, 1000);
  }

  function stopTimer() {
    if (gameTimer) {
      clearInterval(gameTimer);
    }
  }

  function resetGame() {
    stopTimer();
    game.reset();
    gameStarted = false;
    document.getElementById("reset-game").disabled = true;
    document.getElementById("reset-game").classList.remove("active");
    document.getElementById("reset-game").classList.add("disabled");
    document.getElementById("start-game").disabled = false;
    enemySpeed = 1; // Reset enemy speed
    timeElapsed = 0;
    document.getElementById("timer-display").innerText = "Time: 00:00";
  }

  function gameOver() {
    stopTimer();
    alert(`Game Over! You lasted ${timeElapsed} seconds.`);
    resetGame();
  }

  document.getElementById("start-game").addEventListener("click", () => {
    if (!gameStarted) {
      if (!game) {
        game = new Game(); // Start a new game instance
      } else {
        game.reset(); // Reset the game state
      }
      startTimer();
      gameStarted = true;
      document.getElementById("start-game").disabled = true;
      document.getElementById("reset-game").disabled = false;
      document.getElementById("reset-game").classList.remove("disabled");
      document.getElementById("reset-game").classList.add("active");
    }
  });

  document.getElementById("reset-game").addEventListener("click", resetGame);

  class Game {
    constructor() {
      this.gameCanvas = document.getElementById("game-canvas"); // Ensure gameCanvas is initialized
      this.speedDisplay = document.getElementById("speed-display");
      this.offsetHeight = this.gameCanvas.clientHeight;
      this.offsetWidth = this.gameCanvas.clientWidth;

      this.player = new Player(this);
      this.chasingEnemy = new ChasingEnemy(this);
      this.sentryEnemy = new SentryEnemy(this);
      this.dots = [];
      this.projectiles = [];
      this.init();
    }

    init() {
      this.spawnDots();
      this.update();
      this.setupEventListeners();
    }

    spawnDots() {
      const currentGreen = this.dots.filter((dot) => dot.color === "green").length;
      const currentRed = this.dots.filter((dot) => dot.color === "red").length;

      if (currentGreen < MIN_DOTS) {
        for (let i = 0; i < MIN_DOTS - currentGreen; i++) {
          this.dots.push(new Dot("green", this));
        }
      }

      if (currentRed < MIN_DOTS) {
        for (let i = 0; i < MIN_DOTS - currentRed; i++) {
          this.dots.push(new Dot("red", this));
        }
      }
    }

    checkCollision(dot) {
      if (
        this.player.x < dot.x + DOT_SIZE &&
        this.player.x + PLAYER_FIGURE > dot.x &&
        this.player.y < dot.y + DOT_SIZE &&
        this.player.y + PLAYER_FIGURE > dot.y
      ) {
        if (dot.color === "green") {
          this.player.speedMultiplier = Math.min(this.player.speedMultiplier + 0.1, MAX_SPEED / BASE_SPEED);
          this.showEffect("⬆️", "green");
        } else if (dot.color === "red") {
          this.player.speedMultiplier = Math.max(this.player.speedMultiplier - 0.2, MIN_SPEED / BASE_SPEED);
          this.showEffect("⬇️", "red");
        }
        dot.respawn();
      }
    }

    checkPlayerCollision() {
      // Check collision with chasing enemy
      if (
        Math.abs(this.player.x - this.chasingEnemy.x) < COLLISION_THRESHOLD &&
        Math.abs(this.player.y - this.chasingEnemy.y) < COLLISION_THRESHOLD
      ) {
        gameOver();
      }

      // Check collision with projectiles
      this.projectiles.forEach((projectile) => {
        if (Math.abs(this.player.x - projectile.x) < COLLISION_THRESHOLD && Math.abs(this.player.y - projectile.y) < COLLISION_THRESHOLD) {
          gameOver();
        }
      });
    }

    showEffect(symbol, color) {
      const effect = document.createElement("div");
      effect.innerText = symbol;
      effect.style.position = "absolute";
      effect.style.left = `${this.player.x + 10}px`;
      effect.style.top = `${this.player.y - 20}px`;
      effect.style.fontSize = "20px";
      effect.style.fontWeight = "bold";
      effect.style.color = color;
      effect.style.backgroundColor = color === "green" ? "rgba(144, 238, 144, 0.6)" : "rgba(255, 99, 71, 0.6)";
      effect.style.padding = "5px";
      effect.style.borderRadius = "10px";
      effect.style.opacity = 1;
      this.gameCanvas.appendChild(effect);

      let opacity = 1;
      const animation = setInterval(() => {
        opacity -= 0.05;
        effect.style.opacity = opacity;
        effect.style.top = `${parseInt(effect.style.top) - 2}px`;
        if (opacity <= 0) {
          clearInterval(animation);
          this.gameCanvas.removeChild(effect);
        }
      }, 50);
    }

    update() {
      this.offsetHeight = this.gameCanvas.clientHeight;
      this.offsetWidth = this.gameCanvas.clientWidth;
      this.player.move();
      this.chasingEnemy.move(); // Move the chasing enemy
      this.sentryEnemy.update(); // Update sentry and projectiles
      this.checkPlayerCollision(); // Check for collisions

      const currentSpeed = BASE_SPEED * this.player.speedMultiplier;
      this.speedDisplay.innerText = `Speed: ${currentSpeed.toFixed(2)} Frames/Second`;

      this.dots.forEach((dot) => {
        this.checkCollision(dot);
        dot.update();
      });

      this.spawnDots();
      requestAnimationFrame(() => this.update());
    }

    setupEventListeners() {
      document.addEventListener("keydown", (event) => {
        switch (event.key) {
          case "ArrowUp":
          case "w":
            this.player.movement.up = true;
            break;
          case "ArrowDown":
          case "s":
            this.player.movement.down = true;
            break;
          case "ArrowLeft":
          case "a":
            this.player.movement.left = true;
            break;
          case "ArrowRight":
          case "d":
            this.player.movement.right = true;
            break;
        }
      });

      document.addEventListener("keyup", (event) => {
        switch (event.key) {
          case "ArrowUp":
          case "w":
            this.player.movement.up = false;
            break;
          case "ArrowDown":
          case "s":
            this.player.movement.down = false;
            break;
          case "ArrowLeft":
          case "a":
            this.player.movement.left = false;
            break;
          case "ArrowRight":
          case "d":
            this.player.movement.right = false;
            break;
        }
      });
    }

    reset() {
      this.player.reset();
      this.chasingEnemy.reset(); // Reset chasing enemy
      this.sentryEnemy.reset(); // Reset sentry enemy
      this.dots = [];
      this.projectiles = [];
      document.getElementById("speed-display").innerText = "Speed: 0 Frames/Second";
    }
  }

  class Dot {
    constructor(color, game) {
      this.color = color;
      this.game = game;
      this.element = document.createElement("div");
      this.element.className = "dot";
      this.element.style.backgroundColor = this.color;
      this.element.style.width = `${DOT_SIZE}px`;
      this.element.style.height = `${DOT_SIZE}px`;
      this.element.style.position = "absolute";

      this.respawn();
      this.game.gameCanvas.appendChild(this.element);
    }

    // Place the dot randomly within the game canvas
    respawn() {
      this.x = Math.random() * (this.game.offsetWidth - DOT_SIZE);
      this.y = Math.random() * (this.game.offsetHeight - DOT_SIZE);
      this.updatePosition();

      // Set up a decay timer for the dot to respawn in case it isn't collected
      clearTimeout(this.decayTimer);
      this.decayTimer = setTimeout(() => this.respawn(), DECAY_TIME);
    }

    updatePosition() {
      this.element.style.left = `${this.x}px`;
      this.element.style.top = `${this.y}px`;
    }

    update() {
      this.updatePosition();
    }
  }

  class Player {
    constructor(game) {
      this.element = document.querySelector(".player");
      this.x = 0;
      this.y = 0;
      this.speedMultiplier = 1;
      this.movement = {
        up: false,
        down: false,
        left: false,
        right: false
      };
      this.game = game;

      // Set player color to blue
      this.element.style.backgroundColor = "blue";
      this.element.style.left = `${this.x}px`;
      this.element.style.top = `${this.y}px`;
    }

    move() {
      let playerSpeed = BASE_SPEED * this.speedMultiplier;

      if (this.movement.up && this.y > 0) {
        this.y -= playerSpeed;
      }
      if (this.movement.down && this.y + PLAYER_FIGURE < this.game.gameCanvas.clientHeight) {
        this.y += playerSpeed;
      }
      if (this.movement.left && this.x > 0) {
        this.x -= playerSpeed;
      }
      if (this.movement.right && this.x + PLAYER_FIGURE < this.game.gameCanvas.clientWidth) {
        this.x += playerSpeed;
      }

      this.element.style.left = `${this.x}px`;
      this.element.style.top = `${this.y}px`;
    }

    reset() {
      this.x = 0;
      this.y = 0;
      this.speedMultiplier = 1;
      this.element.style.left = `${this.x}px`;
      this.element.style.top = `${this.y}px`;
    }
  }

  class ChasingEnemy {
    constructor(game) {
      this.element = document.createElement("div");
      this.element.className = "chasing-enemy";
      this.game = game;
      this.x = Math.random() * (game.offsetWidth - 20);
      this.y = Math.random() * (game.offsetHeight - 20);
      this.speed = 1; // Start at 1 frame/s
      this.element.style.backgroundColor = "black"; // Set chaser color to black
      this.game.gameCanvas.appendChild(this.element);

      this.updatePosition();
    }

    move() {
      const { x: playerX, y: playerY } = this.game.player;

      const deltaX = playerX - this.x;
      const deltaY = playerY - this.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      // Move towards the player
      this.x += (deltaX / distance) * this.speed;
      this.y += (deltaY / distance) * this.speed;

      // Increase speed gradually until max speed
      this.speed = Math.min(this.speed + ENEMY_SPEED_INCREASE_RATE, MAX_ENEMY_SPEED);

      this.updatePosition();
    }

    updatePosition() {
      this.element.style.left = `${this.x}px`;
      this.element.style.top = `${this.y}px`;
    }

    reset() {
      this.x = Math.random() * (this.game.offsetWidth - 20);
      this.y = Math.random() * (this.game.offsetHeight - 20);
      this.speed = 1;
      this.updatePosition();
    }
  }

  class SentryEnemy {
    constructor(game) {
      this.element = document.createElement("div");
      this.element.className = "sentry-enemy";
      this.game = game;
      this.x = Math.random() * (game.offsetWidth - 20);
      this.y = Math.random() * (game.offsetHeight - 20);
      this.element.style.backgroundColor = "white"; // Set sentry color to white
      this.element.style.border = "2px solid black"; // Set black border
      this.game.gameCanvas.appendChild(this.element);
      this.lastShotTime = 0;

      this.updatePosition();
    }

    update() {
      const currentTime = Date.now();
      if (currentTime - this.lastShotTime >= SHOOT_INTERVAL) {
        this.shoot();
        this.lastShotTime = currentTime;
      }
    }

    shoot() {
      const { x: playerX, y: playerY } = this.game.player;
      const deltaX = playerX - this.x;
      const deltaY = playerY - this.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      const velocityX = (deltaX / distance) * 5;
      const velocityY = (deltaY / distance) * 5;

      const projectile = new Projectile(this.x, this.y, velocityX, velocityY, this.game);
      this.game.projectiles.push(projectile);
    }

    updatePosition() {
      this.element.style.left = `${this.x}px`;
      this.element.style.top = `${this.y}px`;
    }

    reset() {
      this.x = Math.random() * (this.game.offsetWidth - 20);
      this.y = Math.random() * (this.game.offsetHeight - 20);
      this.updatePosition();
    }
  }

  class Projectile {
    constructor(x, y, velocityX, velocityY, game) {
      this.element = document.createElement("div");
      this.element.className = "projectile";
      this.x = x;
      this.y = y;
      this.velocityX = velocityX;
      this.velocityY = velocityY;
      this.game = game;
      this.element.style.width = `${PROJECTILE_SIZE}px`; // Adjusted size
      this.element.style.height = `${PROJECTILE_SIZE}px`;
      this.element.style.backgroundColor = "gold"; // Shiny color
      this.element.style.borderRadius = "50%";
      this.element.style.position = "absolute";
      this.game.gameCanvas.appendChild(this.element);

      this.updatePosition();
      this.move();
    }

    move() {
      const interval = setInterval(() => {
        this.x += this.velocityX;
        this.y += this.velocityY;

        if (this.x < 0 || this.x > this.game.offsetWidth || this.y < 0 || this.y > this.game.offsetHeight) {
          clearInterval(interval);
          this.game.gameCanvas.removeChild(this.element); // Remove projectile when out of bounds
        } else {
          this.updatePosition();
        }
      }, 16);
    }

    updatePosition() {
      this.element.style.left = `${this.x}px`;
      this.element.style.top = `${this.y}px`;
    }
  }

  // Start the game
  game = new Game();
});
