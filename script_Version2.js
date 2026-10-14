// Simple Pong game with Pause/Resume button
(() => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  const leftScoreEl = document.getElementById('leftScore');
  const rightScoreEl = document.getElementById('rightScore');
  const startBtn = document.getElementById('startBtn');
  const pauseBtn = document.getElementById('pauseBtn');

  const W = canvas.width;
  const H = canvas.height;

  // Game objects
  const paddleWidth = 12;
  const paddleHeight = 100;
  const paddleInset = 20;

  const player = {
    x: paddleInset,
    y: (H - paddleHeight) / 2,
    width: paddleWidth,
    height: paddleHeight,
    speed: 6,
    moveUp: false,
    moveDown: false,
  };

  const computer = {
    x: W - paddleInset - paddleWidth,
    y: (H - paddleHeight) / 2,
    width: paddleWidth,
    height: paddleHeight,
    speed: 4.2 // AI max speed
  };

  const ball = {
    x: W / 2,
    y: H / 2,
    radius: 8,
    speed: 5,
    vx: 0,
    vy: 0,
    speedIncrement: 0.3,
    maxSpeed: 12
  };

  let leftScore = 0;
  let rightScore = 0;

  // running: whether the game updates (not paused)
  // isPaused: whether the user paused the game
  let running = false;
  let isPaused = false;
  let lastTime = null;

  // Initialize ball with random angle toward a side (dir = 1 right, -1 left)
  function serve(dir = (Math.random() < 0.5 ? -1 : 1)) {
    ball.x = W / 2;
    ball.y = H / 2;
    const angle = (Math.random() * Math.PI / 4) - (Math.PI / 8); // -22.5deg to 22.5deg
    ball.speed = 5;
    ball.vx = dir * ball.speed * Math.cos(angle);
    ball.vy = ball.speed * Math.sin(angle);
  }

  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  function update(delta) {
    // Player movement via keys
    if (player.moveUp) player.y -= player.speed;
    if (player.moveDown) player.y += player.speed;

    // Clamp player to canvas
    player.y = clamp(player.y, 0, H - player.height);

    // Computer AI: follow ball with smoothing and max speed
    const targetY = ball.y - computer.height / 2;
    const diff = targetY - computer.y;
    const aiSpeed = computer.speed * (Math.abs(diff) > 12 ? 1 : 0.55);
    if (Math.abs(diff) > aiSpeed) {
      computer.y += Math.sign(diff) * aiSpeed;
    } else {
      computer.y += diff;
    }
    computer.y = clamp(computer.y, 0, H - computer.height);

    // Ball movement
    ball.x += ball.vx;
    ball.y += ball.vy;

    // Top/bottom collision
    if (ball.y - ball.radius < 0) {
      ball.y = ball.radius;
      ball.vy = -ball.vy;
    } else if (ball.y + ball.radius > H) {
      ball.y = H - ball.radius;
      ball.vy = -ball.vy;
    }

    // Left paddle collision
    if (ball.x - ball.radius <= player.x + player.width) {
      if (ball.y >= player.y && ball.y <= player.y + player.height && ball.vx < 0) {
        // collision: compute bounce angle depending on where it hit the paddle
        const relativeY = (player.y + player.height / 2) - ball.y;
        const normalized = relativeY / (player.height / 2); // -1 .. 1
        const maxBounce = Math.PI / 3; // 60 degrees
        const angle = normalized * maxBounce;
        ball.speed = Math.min(ball.speed + ball.speedIncrement, ball.maxSpeed);
        const dir = 1; // bounce right
        ball.vx = dir * ball.speed * Math.cos(angle);
        ball.vy = -ball.speed * Math.sin(angle);
        // push ball out to prevent sticking
        ball.x = player.x + player.width + ball.radius + 0.5;
      }
    }

    // Right paddle collision
    if (ball.x + ball.radius >= computer.x) {
      if (ball.y >= computer.y && ball.y <= computer.y + computer.height && ball.vx > 0) {
        const relativeY = (computer.y + computer.height / 2) - ball.y;
        const normalized = relativeY / (computer.height / 2);
        const maxBounce = Math.PI / 3;
        const angle = normalized * maxBounce;
        ball.speed = Math.min(ball.speed + ball.speedIncrement, ball.maxSpeed);
        const dir = -1; // bounce left
        ball.vx = dir * ball.speed * Math.cos(angle);
        ball.vy = -ball.speed * Math.sin(angle);
        ball.x = computer.x - ball.radius - 0.5;
      }
    }

    // Score: left missed
    if (ball.x + ball.radius < 0) {
      rightScore++;
      updateScoreBoard();
      // pause briefly and then auto-serve if the game is not paused by the user
      running = false;
      serve(1);
      setTimeout(() => { if (!isPaused) running = true; }, 600);
    } else if (ball.x - ball.radius > W) {
      leftScore++;
      updateScoreBoard();
      running = false;
      serve(-1);
      setTimeout(() => { if (!isPaused) running = true; }, 600);
    }
  }

  function drawNet() {
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    const step = 16;
    const w = 4;
    for (let y = 0; y < H; y += step) {
      ctx.fillRect(W / 2 - w/2, y + 4, w, step/2);
    }
  }

  function draw() {
    // Clear
    ctx.fillStyle = '#04101b';
    ctx.fillRect(0, 0, W, H);

    // Net
    drawNet();

    // Paddles
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    ctx.fillRect(computer.x, computer.y, computer.width, computer.height);

    // Ball
    ctx.beginPath();
    ctx.fillStyle = '#23d5ab';
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI*2);
    ctx.fill();

    // Scores (draw center)
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.font = '18px system-ui, Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${leftScore}`, W * 0.25, 28);
    ctx.fillText(`${rightScore}`, W * 0.75, 28);

    // If paused, show overlay
    if (isPaused) {
      ctx.fillStyle = 'rgba(2,16,20,0.55)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#23d5ab';
      ctx.font = '28px system-ui, Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Paused', W/2, H/2);
    }
  }

  function gameLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const delta = timestamp - lastTime;
    lastTime = timestamp;

    if (running) {
      update(delta);
    }

    draw();

    requestAnimationFrame(gameLoop);
  }

  // Input handling
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const y = e.clientY - rect.top;
    // Move player paddle so its center matches mouse y
    player.y = clamp(y - player.height / 2, 0, H - player.height);
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') player.moveUp = true;
    if (e.key === 'ArrowDown') player.moveDown = true;
    if (e.key === 'r' || e.key === 'R') {
      leftScore = 0; rightScore = 0; updateScoreBoard();
      serve(Math.random() < 0.5 ? -1 : 1);
    }
    if (e.key === ' ' ) {
      // toggle play/pause with space
      togglePause();
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowUp') player.moveUp = false;
    if (e.key === 'ArrowDown') player.moveDown = false;
  });

  // Touch support: track touch to move left paddle
  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const y = touch.clientY - rect.top;
    player.y = clamp(y - player.height / 2, 0, H - player.height);
  }, { passive: false });

  function updateScoreBoard() {
    leftScoreEl.textContent = leftScore;
    rightScoreEl.textContent = rightScore;
  }

  // Start button: start/resume game and clear paused state
  startBtn.addEventListener('click', () => {
    isPaused = false;
    running = true;
    pauseBtn.textContent = 'Pause';
    startBtn.textContent = 'Start';
  });

  // Pause button: toggle pause/resume
  function togglePause() {
    isPaused = !isPaused;
    if (isPaused) {
      running = false;
      pauseBtn.textContent = 'Resume';
    } else {
      running = true;
      pauseBtn.textContent = 'Pause';
    }
  }

  pauseBtn.addEventListener('click', () => {
    togglePause();
  });

  // Keep space key toggle and pause button in sync if other code toggles running
  // (No extra code required because togglePause updates the button text.)

  // Start initial state
  serve(Math.random() < 0.5 ? -1 : 1);
  updateScoreBoard();
  running = false;
  isPaused = false;
  pauseBtn.textContent = 'Pause';
  requestAnimationFrame(gameLoop);
})();