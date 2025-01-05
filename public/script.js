const socket = io();
let currentRoom = null;
let mySymbol = null;
let isMyTurn = false;
let playerName = "";
let opponentName = "";

function setName() {
  const nameInput = document.getElementById("playerName");
  const name = nameInput.value.trim();

  if (name.length < 2) {
    alert("Please enter a name with at least 2 characters");
    return;
  }

  playerName = name;
  socket.emit("setName", name);

  document.getElementById("nameInput").style.display = "none";
  document.getElementById("menu").style.display = "block";
  document.getElementById("status").textContent =
    "Click Find Game to start playing";
}

document.getElementById("playerName").addEventListener("keypress", (e) => {
  if (e.key === "Enter") setName();
});

function findGame() {
  const findGameBtn = document.getElementById("findGameBtn");
  findGameBtn.innerHTML = 'Finding Game... <div class="loading"></div>';
  findGameBtn.onclick = cancelSearch;
  findGameBtn.classList.add("cancel");
  socket.emit("findGame");
}

function cancelSearch() {
  const findGameBtn = document.getElementById("findGameBtn");
  findGameBtn.textContent = "Find Game";
  findGameBtn.onclick = findGame;
  findGameBtn.classList.remove("cancel");
  socket.emit("cancelSearch");
}

function makeMove(index) {
  if (!currentRoom || !isMyTurn) return;
  const cell = document.getElementsByClassName("cell")[index];
  if (cell.textContent !== "") return;

  socket.emit("makeMove", { roomId: currentRoom, index });
}

function showGameOver(result, winner, winnerName) {
  const over = document.getElementById("gameOver");
  const resultIcon = document.getElementById("resultIcon");
  const resultTitle = document.getElementById("resultTitle");
  const resultMessage = document.getElementById("resultMessage");
  const playerSymbol = document.getElementById("playerSymbol");

  playerSymbol.textContent = mySymbol;

  if (result === "draw") {
    resultIcon.textContent = "🤝";
    resultTitle.textContent = "It's a Draw!";
    resultMessage.textContent = "Great game! Both players played well.";
  } else if (winner === mySymbol) {
    resultIcon.textContent = "🏆";
    resultTitle.textContent = "Victory!";
    resultMessage.textContent = `Congratulations ${playerName}! You've won the game!`;
  } else {
    resultIcon.textContent = "💪";
    resultTitle.textContent = "Good Try!";
    resultMessage.textContent = `${winnerName} won this round. Better luck next time!`;
  }

  over.classList.add("active");
}

function closeGameOver() {
  const over = document.getElementById("gameOver");
  over.classList.remove("active");

  document.getElementById("board").style.display = "none";
  const findGameBtn = document.getElementById("findGameBtn");
  findGameBtn.style.display = "inline-block";
  findGameBtn.textContent = "Find Game";
  findGameBtn.onclick = findGame;
  findGameBtn.classList.remove("cancel");
  document.getElementById('status').innerText = 'Click Find Game to start playing'

  const cells = document.getElementsByClassName("cell");
  for (let i = 0; i < cells.length; i++) {
    cells[i].textContent = "";
    cells[i].className = "cell";
  }

  currentRoom = null;
  isMyTurn = false;
  opponentName = "";
}

socket.on("waiting", () => {
  document.getElementById("status").textContent = "Waiting for opponent...";
});

socket.on("searchCancelled", () => {
  document.getElementById("status").textContent =
    "Search cancelled. Click Find Game to try again.";
});

socket.on("playerAssignment",
  ({ symbol, isYourTurn, roomId, opponentName: oppName }) => {
    currentRoom = roomId;
    mySymbol = symbol;
    isMyTurn = isYourTurn;
    opponentName = oppName;

    document.getElementById("board").style.display = "grid";
    document.getElementById("findGameBtn").style.display = "none";
    document.getElementById(
      "status"
    ).textContent = `You (${playerName}) are ${symbol}, playing against ${opponentName}. ${
      isYourTurn ? "Your turn!" : "Opponent's turn!"
    }`;
  }
);

socket.on("gameStart", () => {
  document.getElementById("status").textContent = isMyTurn
    ? "Your turn!"
    : `${opponentName}'s turn!`;
});

socket.on("updateBoard", ({ board, currentPlayer }) => {
  const cells = document.getElementsByClassName("cell");
  for (let i = 0; i < cells.length; i++) {
    if (board[i]) {
      cells[i].textContent = board[i];
      cells[i].classList.add(board[i].toLowerCase());
    }
  }
  isMyTurn = socket.id === currentPlayer;
  document.getElementById("status").textContent = isMyTurn
    ? "Your turn!"
    : `${opponentName}'s turn!`;
});

socket.on("gameOver", ({ winner, winnerName }) => {
  const cells = document.getElementsByClassName("cell");

  if (winner !== "draw") {
    const winningCombos = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];

    for (const combo of winningCombos) {
      if (
        cells[combo[0]].textContent === winner &&
        cells[combo[1]].textContent === winner &&
        cells[combo[2]].textContent === winner
      ) {
        combo.forEach((index) => cells[index].classList.add("winner"));
        break;
      }
    }
  }

  showGameOver(winner === "draw" ? "draw" : "win", winner, winnerName);
});

socket.on("playerDisconnected", ({ playerName: disconnectedPlayer }) => {
  document.getElementById(
    "status"
  ).textContent = `${disconnectedPlayer} disconnected!`;
  setTimeout(() => {
    closeGameOver();
    document.getElementById("status").textContent =
      "Click Find Game to play again";
  }, 2000);
});
