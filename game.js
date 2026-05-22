// @ts-nocheck
const canvas = document.querySelector('canvas');

// get the context of the canvas
const ctx = canvas.getContext('2d');

// set the width and height of the canvas to occupy the whole screen
canvas.width = innerWidth;
canvas.height = innerHeight;

// get the score element
const scoreEl = document.querySelector('#score');

const modalEl = document.querySelector('#modal');
const startGameBtnEl = document.querySelector('#startGameBtn');
const modalScoreEl = document.querySelector('#modal-score');

// We need to create a circle, which is a player, hence we are creating a class for the player
class Player {
  constructor(x, y, radius, color) {
    // positions - center of the canvas
    this.x = x;
    this.y = y;

    // size and color of the circle
    this.radius = radius;
    this.color = color;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.fillStyle = this.color;
    ctx.fill();
  }
}

// Create Projectile class
class Projectile {
  constructor(x, y, radius, color, velocity) {
    // positions - center of the canvas
    this.x = x;
    this.y = y;

    // size and color of the circle
    this.radius = radius;
    this.color = color;

    // velocity
    this.velocity = velocity;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.fillStyle = this.color;
    ctx.fill();
  }

  drawAndUpdate() {
    this.draw();

    // update the co-ordinates
    this.x = this.x + this.velocity.x;
    this.y = this.y + this.velocity.y;
  }
}

// Enemy class to create enemies
class Enemy {
  constructor(x, y, radius, color, velocity) {
    // positions - center of the canvas
    this.x = x;
    this.y = y;

    // size and color of the circle
    this.radius = radius;
    this.color = color;

    // velocity
    this.velocity = velocity;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.fillStyle = this.color;
    ctx.fill();
  }

  drawAndUpdate() {
    this.draw();

    // update the co-ordinates
    this.x = this.x + this.velocity.x;
    this.y = this.y + this.velocity.y;
  }
}

const friction = 0.99;
// Particle
class Particle {
  constructor(x, y, radius, color, velocity) {
    // positions - center of the canvas
    this.x = x;
    this.y = y;

    // size and color of the circle
    this.radius = radius;
    this.color = color;

    // velocity
    this.velocity = velocity;

    this.alpha = 1;
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.restore();
  }

  drawAndUpdate() {
    this.draw();

    this.velocity.x *= friction;
    this.velocity.y *= friction;

    // update the co-ordinates
    this.x = this.x + this.velocity.x;
    this.y = this.y + this.velocity.y;

    // reduce the alpha
    this.alpha -= 0.01;
  }
}

// Keep the player in the center of the canvas
const x = canvas.width / 2;
const y = canvas.height / 2;

let player = new Player(x, y, 10, 'white');
player.draw();

let projectiles = [];
let enemies = [];
let particles = [];

function init() {
  player = new Player(x, y, 10, 'white');
  player.draw();

  projectiles = [];
  enemies = [];
  particles = [];

  // update the score to 0
  score = 0;
  scoreEl.textContent = score;
  modalScoreEl.textContent = score;
}

// create a new enemy after every 1 second
function spawnEnemies() {
  setInterval(() => {
    const radius = Math.random() * (30 - 10) + 10;
    let x;
    let y;

    if (Math.random() < 0.5) {
      x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius;
      y = Math.random() * canvas.height;
    } else {
      x = Math.random() * canvas.width;
      y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius;
    }

    const random = Math.random() * 360;
    const color = `hsl(${random}, 50%, 50%)`;
    // get the angle from atan2 function
    const angle = Math.atan2(canvas.height / 2 - y, canvas.width / 2 - x);

    const velocity = {
      x: Math.cos(angle),
      y: Math.sin(angle),
    };

    const enemy = new Enemy(x, y, radius, color, velocity);
    enemies.push(enemy);
  }, 1000);
}

let animationId;
let score = 0;
function animate() {
  animationId = requestAnimationFrame(animate);

  // give background color to the canvas
  ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // clear the canvas on every loop
  // ctx.clearRect(0, 0, canvas.width, canvas.height);

  // draw the player and projectile after clearing the canvas
  player.draw();

  // iterate the particles
  particles.forEach((particle, index) => {
    if (particle.alpha <= 0) {
      particles.splice(index, 1);
    } else {
      particle.drawAndUpdate();
    }
  });

  projectiles.forEach((projectile, pIdx) => {
    projectile.drawAndUpdate();

    // remove the projectile once it reaches the edges
    if (projectile.x + projectile.radius < 0 || projectile.x - projectile.radius > canvas.width || projectile.y + projectile.radius < 0 || projectile.y - projectile.radius > canvas.height) {
      setTimeout(() => {
        projectiles.splice(pIdx, 1);
      }, 0);
    }
  });

  // loop through enemies and draw the enemies
  enemies.forEach((enemy, eIdx) => {
    enemy.drawAndUpdate();

    // detect a collision between enemy and the player
    const distance = Math.hypot(player.x - enemy.x, player.y - enemy.y);

    if (distance - enemy.radius - player.radius < 1) {
      // end the game
      cancelAnimationFrame(animationId);

      // update the score and show the modal on game end
      setTimeout(() => {
        modalScoreEl.textContent = score;
        modalEl.style.display = 'flex';
      }, 0);
    }

    // loop through projectiles to detect the collision
    projectiles.forEach((projectile, pIdx) => {
      // find the distance
      const distance = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);

      // place where projectile hits the enemy
      if (distance - enemy.radius - projectile.radius < 1) {
        // create the particles
        for (let i = 0; i < enemy.radius * 2; i++) {
          particles.push(
            new Particle(projectile.x, projectile.y, Math.random() * 3, enemy.color, {
              x: (Math.random() - 0.5) * (Math.random() * 6),
              y: (Math.random() - 0.5) * (Math.random() * 6),
            }),
          );
        }
        if (enemy.radius - 10 > 5) {
          score += 100;
          gsap.to(enemy, {
            radius: enemy.radius - 10,
          });

          // remove the projectile
          setTimeout(() => {
            projectiles.splice(pIdx, 1);
          }, 0);
        } else {
          score += 250;
          // remove the enemy and projectile as collision is detected
          setTimeout(() => {
            enemies.splice(eIdx, 1);
            projectiles.splice(pIdx, 1);
          }, 0);
        }

        scoreEl.textContent = score;
      }
    });
  });
}

function createAndMoveProjectile(event) {
  // get the angle from atan2 function
  const angle = Math.atan2(event.clientY - y, event.clientX - x);

  const velocity = {
    x: Math.cos(angle) * 5,
    y: Math.sin(angle) * 5,
  };

  const projectile = new Projectile(x, y, 5, 'white', velocity);

  // create and push the projectile into the projectiles array on every click
  projectiles.push(projectile);
}

addEventListener('click', createAndMoveProjectile);

startGameBtnEl.addEventListener('click', () => {
  // initialize the game
  init();

  animate();
  spawnEnemies();

  // remove the modalEl
  modalEl.style.display = 'none';
});
