(() => {
  const COLS = 10;
  const ROWS = 20;
  const CELL = 20;
  const DROP_INTERVAL = 500;

  const canvas = document.getElementById('board');
  const ctx = canvas.getContext('2d');
  const overlay = document.getElementById('overlay');
  const overlayText = document.getElementById('overlay-text');
  const overlayScore = document.getElementById('overlay-score');
  const restartBtn = document.getElementById('restart-btn');
  const scoreEl = document.getElementById('score');

  const LINE_SCORES = { 1: 40, 2: 100, 3: 300, 4: 1200 };

  const COLORS = {
    I: '#4dd0e1',
    J: '#4d7cd1',
    L: '#e0a24d',
    O: '#e0d24d',
    S: '#7cd14d',
    T: '#b04dd1',
    Z: '#d14d5c',
  };

  const SHAPES = {
    I: [
      [0, 0], [1, 0], [2, 0], [3, 0],
    ],
    J: [
      [0, 0], [0, 1], [1, 1], [2, 1],
    ],
    L: [
      [2, 0], [0, 1], [1, 1], [2, 1],
    ],
    O: [
      [0, 0], [1, 0], [0, 1], [1, 1],
    ],
    S: [
      [1, 0], [2, 0], [0, 1], [1, 1],
    ],
    T: [
      [1, 0], [0, 1], [1, 1], [2, 1],
    ],
    Z: [
      [0, 0], [1, 0], [1, 1], [2, 1],
    ],
  };

  const PIECE_TYPES = Object.keys(SHAPES);

  let board, current, gameOver, dropCounter, lastTime, rafId, score;

  function createBoard() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  }

  function randomType() {
    return PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];
  }

  function spawnPiece() {
    const type = randomType();
    const cells = SHAPES[type].map(([x, y]) => ({ x, y }));
    const width = Math.max(...cells.map(c => c.x)) + 1;
    const piece = {
      type,
      cells,
      x: Math.floor((COLS - width) / 2),
      y: 0,
    };
    if (collides(piece, 0, 0)) {
      endGame();
    }
    return piece;
  }

  function collides(piece, dx, dy, cells = piece.cells) {
    return cells.some(({ x, y }) => {
      const nx = piece.x + x + dx;
      const ny = piece.y + y + dy;
      if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
      if (ny < 0) return false;
      return board[ny][nx] !== null;
    });
  }

  function rotateCells(cells) {
    // rotate 90deg clockwise around the piece's bounding box center
    const maxX = Math.max(...cells.map(c => c.x));
    const maxY = Math.max(...cells.map(c => c.y));
    const size = Math.max(maxX, maxY);
    return cells.map(({ x, y }) => ({ x: size - y, y: x }));
  }

  function tryRotate() {
    if (current.type === 'O') return;
    const rotated = rotateCells(current.cells);
    const kicks = [0, -1, 1, -2, 2];
    for (const dx of kicks) {
      if (!collides(current, dx, 0, rotated)) {
        current.cells = rotated;
        current.x += dx;
        return;
      }
    }
  }

  function lockPiece() {
    current.cells.forEach(({ x, y }) => {
      const bx = current.x + x;
      const by = current.y + y;
      if (by >= 0) board[by][bx] = COLORS[current.type];
    });
    const cleared = clearLines();
    if (cleared > 0) addScore(cleared);
    current = spawnPiece();
  }

  function clearLines() {
    let cleared = 0;
    for (let y = ROWS - 1; y >= 0; y--) {
      if (board[y].every(cell => cell !== null)) {
        board.splice(y, 1);
        board.unshift(Array(COLS).fill(null));
        cleared++;
        y++;
      }
    }
    return cleared;
  }

  function addScore(linesCleared) {
    score += LINE_SCORES[linesCleared] || 0;
    scoreEl.textContent = score;
  }

  function move(dx, dy) {
    if (gameOver) return;
    if (!collides(current, dx, dy)) {
      current.x += dx;
      current.y += dy;
      return true;
    }
    if (dy > 0) {
      lockPiece();
    }
    return false;
  }

  function endGame() {
    gameOver = true;
    overlayText.textContent = 'Game Over';
    overlayScore.textContent = `Score: ${score}`;
    overlay.classList.remove('hidden');
  }

  function draw() {
    ctx.fillStyle = '#0f0f1e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const cell = board[y][x];
        if (cell) drawCell(x, y, cell);
      }
    }

    if (current) {
      current.cells.forEach(({ x, y }) => {
        const by = current.y + y;
        if (by >= 0) drawCell(current.x + x, by, COLORS[current.type]);
      });
    }
  }

  function drawCell(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * CELL, y * CELL, CELL - 1, CELL - 1);
  }

  function update(time = 0) {
    const delta = time - lastTime;
    lastTime = time;
    if (!gameOver) {
      dropCounter += delta;
      if (dropCounter > DROP_INTERVAL) {
        move(0, 1);
        dropCounter = 0;
      }
      draw();
      rafId = requestAnimationFrame(update);
    }
  }

  function start() {
    board = createBoard();
    gameOver = false;
    dropCounter = 0;
    lastTime = 0;
    score = 0;
    scoreEl.textContent = score;
    overlay.classList.add('hidden');
    current = spawnPiece();
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(update);
  }

  document.addEventListener('keydown', (e) => {
    if (gameOver) return;
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        move(-1, 0);
        break;
      case 'ArrowRight':
        e.preventDefault();
        move(1, 0);
        break;
      case 'ArrowDown':
        e.preventDefault();
        move(0, 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        tryRotate();
        break;
    }
  });

  restartBtn.addEventListener('click', start);

  start();
})();
