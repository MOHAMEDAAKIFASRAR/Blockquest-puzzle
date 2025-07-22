const canvas = document.getElementById("mazeCanvas");
const ctx = canvas.getContext("2d");
const winSound = document.getElementById("winSound");
const moveSound = document.getElementById("moveSound");

const canvasSize = 600;

let rows, cols;
let cellSize;
let grid = [];
let stack = [];
let current;
let player;

let generationInterval;

let startTime;
let elapsedTime = 0;
let timerInterval;

let level = 1;
let bestTime = null;
let unlockedLevels = parseInt(localStorage.getItem("unlockedLevels")) || 1;

function showScreen(screen) {
  document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
  screen.classList.remove("hidden");
}

function showMenu() {
  stopTimer();
  showScreen(document.getElementById("menuScreen"));
}

function startGame() {
  level = unlockedLevels;
  initMaze();
  showScreen(document.getElementById("gameScreen"));
}

function showLevelSelect() {
  const container = document.getElementById("levelButtons");
  container.innerHTML = "";

  for (let i = 1; i <= 100; i++) {
    const btn = document.createElement("button");
    btn.textContent = `Level ${i}`;

    if (i <= unlockedLevels) {
      btn.onclick = () => {
        level = i;
        initMaze();
        showScreen(document.getElementById("gameScreen"));
      };
    } else {
      btn.disabled = true;
      btn.style.opacity = 0.4;
      btn.style.cursor = "not-allowed";
    }

    container.appendChild(btn);
  }

  showScreen(document.getElementById("levelScreen"));
}

async function showLeaderboard() {
  const board = document.getElementById("leaderboardList");
  board.innerHTML = "<p>🔍 Loading...</p>";

  if (!contract) {
    board.innerHTML = "<p>⚠️ Wallet not connected.</p>";
    return;
  }

  try {
    const scores = await contract.getTopScores(level);
    if (scores.length === 0) {
      board.innerHTML = "<p>No scores submitted yet!</p>";
      return;
    }

    const table = document.createElement("table");
    table.innerHTML = `
      <thead>
        <tr>
          <th>Wallet</th>
          <th>Level</th>
          <th>Time (s)</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;

    const tbody = table.querySelector("tbody");
    scores.forEach(entry => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${entry.player.substring(0, 6)}...${entry.player.slice(-4)}</td>
        <td>${entry.level}</td>
        <td>${entry.score}</td>
      `;
      tbody.appendChild(row);
    });

    board.innerHTML = "";
    board.appendChild(table);
  } catch (error) {
    console.error("❌ Leaderboard fetch error:", error);
    board.innerHTML = "<p>⚠️ Failed to load leaderboard.</p>";
  }

  showScreen(document.getElementById("leaderboardScreen"));
}





function initMaze() {
  rows = 10 + Math.floor(level * 0.5);
  cols = 10 + Math.floor(level * 0.5);
  cellSize = canvasSize / Math.max(rows, cols);
  grid = [];
  stack = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      grid.push(new Cell(row, col));
    }
  }

  current = grid[0];
  player = { row: 0, col: 0 };
  document.getElementById("levelTitle").textContent = `Level: ${level}`;

  loadBestTime();
  if (generationInterval) clearInterval(generationInterval);
  generationInterval = setInterval(generateMaze, 10);
}

class Cell {
  constructor(row, col) {
    this.row = row;
    this.col = col;
    this.walls = [true, true, true, true];
    this.visited = false;
  }

  draw() {
    const x = this.col * cellSize;
    const y = this.row * cellSize;

    ctx.strokeStyle = "#00fff7";
    ctx.lineWidth = 2;

    if (this.walls[0]) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + cellSize, y);
      ctx.stroke();
    }
    if (this.walls[1]) {
      ctx.beginPath();
      ctx.moveTo(x + cellSize, y);
      ctx.lineTo(x + cellSize, y + cellSize);
      ctx.stroke();
    }
    if (this.walls[2]) {
      ctx.beginPath();
      ctx.moveTo(x + cellSize, y + cellSize);
      ctx.lineTo(x, y + cellSize);
      ctx.stroke();
    }
    if (this.walls[3]) {
      ctx.beginPath();
      ctx.moveTo(x, y + cellSize);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  }

  checkNeighbors() {
    const neighbors = [];

    const top = grid[index(this.row - 1, this.col)];
    const right = grid[index(this.row, this.col + 1)];
    const bottom = grid[index(this.row + 1, this.col)];
    const left = grid[index(this.row, this.col - 1)];

    if (top && !top.visited) neighbors.push(top);
    if (right && !right.visited) neighbors.push(right);
    if (bottom && !bottom.visited) neighbors.push(bottom);
    if (left && !left.visited) neighbors.push(left);

    if (neighbors.length > 0) {
      const r = Math.floor(Math.random() * neighbors.length);
      return neighbors[r];
    } else {
      return undefined;
    }
  }
}

function index(row, col) {
  if (row < 0 || col < 0 || row >= rows || col >= cols) {
    return -1;
  }
  return row * cols + col;
}

function generateMaze() {
  current.visited = true;

  const next = current.checkNeighbors();
  if (next) {
    next.visited = true;
    stack.push(current);
    removeWalls(current, next);
    current = next;
  } else if (stack.length > 0) {
    current = stack.pop();
  }

  draw();

  if (grid.every(cell => cell.visited)) {
    clearInterval(generationInterval);
    startTimer();
  }
}

function removeWalls(a, b) {
  const x = a.col - b.col;
  if (x === 1) {
    a.walls[3] = false;
    b.walls[1] = false;
  } else if (x === -1) {
    a.walls[1] = false;
    b.walls[3] = false;
  }

  const y = a.row - b.row;
  if (y === 1) {
    a.walls[0] = false;
    b.walls[2] = false;
  } else if (y === -1) {
    a.walls[2] = false;
    b.walls[0] = false;
  }
}

function startTimer() {
  startTime = Date.now();
  timerInterval = setInterval(() => {
    elapsedTime = Math.floor((Date.now() - startTime) / 1000);
    document.getElementById("timer").textContent = `Time: ${elapsedTime}s`;
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
}

function drawPlayer() {
  ctx.beginPath();
  ctx.arc(
    player.col * cellSize + cellSize / 2,
    player.row * cellSize + cellSize / 2,
    cellSize / 4,
    0,
    Math.PI * 2
  );
  ctx.fillStyle = "#f7ff00";
  ctx.fill();
  ctx.strokeStyle = "#fff";
  ctx.stroke();
}

function draw() {
  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  grid.forEach(cell => cell.draw());
  drawPlayer();
}

function loadBestTime() {
  const key = `bestTime_Level_${level}`;
  const stored = localStorage.getItem(key);
  if (stored) {
    bestTime = parseInt(stored);
    document.getElementById("best").textContent = `Best Time: ${bestTime}s`;
  } else {
    bestTime = null;
    document.getElementById("best").textContent = `Best Time: -`;
  }
}

function updateBestTime() {
  const key = `bestTime_Level_${level}`;
  if (bestTime === null || elapsedTime < bestTime) {
    bestTime = elapsedTime;
    localStorage.setItem(key, bestTime);
    document.getElementById("best").textContent = `Best Time: ${bestTime}s`;
  }
}

document.addEventListener("keydown", (e) => {
  if (document.getElementById("gameScreen").classList.contains("hidden")) return;

  const cell = grid[index(player.row, player.col)];
  

  let moved = false;
  if (e.key === "ArrowUp" && !cell.walls[0]) { player.row -= 1; moved = true; }
  if (e.key === "ArrowRight" && !cell.walls[1]) { player.col += 1; moved = true; }
  if (e.key === "ArrowDown" && !cell.walls[2]) { player.row += 1; moved = true; }
  if (e.key === "ArrowLeft" && !cell.walls[3]) { player.col -= 1; moved = true; }

  if (moved) moveSound.play();
  draw();

  if (player.row === rows - 1 && player.col === cols - 1) {
    stopTimer();
    updateBestTime();
    winSound.play();

    if (level === unlockedLevels && unlockedLevels < 100) {
      unlockedLevels++;
      localStorage.setItem("unlockedLevels", unlockedLevels);
    }

    setTimeout(() => {
      alert(`🎉 You beat Level ${level} in ${elapsedTime}s!`);
      showMenu();
    }, 100);
  }
});

showMenu();

let contract;
let signer;
let provider;
let userAddress;
const contractAddress = "0x3740AD2d2BD0da0fFE0f14AAf253992c0dFF7561"; // your deployed address
const contractABI = [
  {
    "inputs": [
      { "internalType": "uint256", "name": "level", "type": "uint256" },
      { "internalType": "uint256", "name": "score", "type": "uint256" }
    ],
    "name": "submitScore",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "level", "type": "uint256" }],
    "name": "getTopScores",
    "outputs": [
      {
        "components": [
          { "internalType": "address", "name": "player", "type": "address" },
          { "internalType": "uint256", "name": "level", "type": "uint256" },
          { "internalType": "uint256", "name": "score", "type": "uint256" }
        ],
        "internalType": "struct PuzzleGame.ScoreEntry[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];



async function connectWallet() {
  if (typeof window.ethereum !== "undefined") {
    try {
      provider = new ethers.providers.Web3Provider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);  // Always asks user to choose
      signer = provider.getSigner();
      userAddress = await signer.getAddress();

      contract = new ethers.Contract(contractAddress, contractABI, signer);

      document.getElementById("walletAddress").textContent = "Connected: " + userAddress;
      document.getElementById("submitScoreBtn").disabled = false;
    } catch (err) {
      console.error("Wallet connection error:", err);
      alert("❌ Wallet connection failed. See console.");
    }
  } else {
    alert("Please install MetaMask!");
  }
}


async function submitScore() {
  if (!contract) {
    alert("Connect wallet first!");
    return;
  }

  try {
    const tx = await contract.submitScore(level, elapsedTime);
    await tx.wait();
    alert("✅ Score submitted to blockchain!");
  } catch (err) {
    console.error("Submission failed:", err);
    alert("❌ Submission failed.");
  }
}




document.addEventListener("DOMContentLoaded", () => {
  const connectBtn = document.querySelector("#connectWalletBtn");
  const submitBtn = document.querySelector("#submitScoreBtn");

  if (connectBtn) {
    connectBtn.addEventListener("click", connectWallet);
    console.log("✅ Wallet button listener added");
  }

  if (submitBtn) {
    submitBtn.addEventListener("click", submitScore);
    console.log("✅ Submit button listener added");
  }
});
