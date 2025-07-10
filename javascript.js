function Gameboard() {
  const rows = 3;
  const columns = 3;
  const board = [];

  // Create a 2d array that will represent the state of the game board
  // For this 2d array, row 0 will represent the top row and
  // column 0 will represent the left-most column.
  // This nested-loop technique is a simple and common way to create a 2d array.
  for (let i = 0; i < rows; i++) {
    board[i] = [];
    for (let j = 0; j < columns; j++) {
      board[i].push(Cell());
    }
  }

  // This will be the method of getting the entire board that our
  // UI will eventually need to render it.
  const getBoard = () => board;

  const makeMove = (row, column, player) => {
    board[row][column].addToken(player);
    console.log(board[row][column]);
  };

  // This method will be used to print our board to the console.
  // It is helpful to see what the board looks like after each turn as we play,
  // but we won't need it after we build our UI
  const printBoard = () => {
    const boardWithCellValues = board.map((row) => row.map((cell) => cell.getValue()))
    console.log(boardWithCellValues);
  };

  // Reset the board with "empty" cells
  const resetBoard = () => {
    for (let i = 0; i < rows; i++) {
      for (let j = 0;j < columns; j++) {
        board[i][j] = Cell();
      }
    }
  }

  // Here, we provide an interface for the rest of our
  // application to interact with the board
  return { getBoard, makeMove, printBoard, resetBoard };
}

function Cell() {
  let value = "-";

  // Accept a player's token to change the value of the cell
  const addToken = (player) => {
    value = player;
  };

  // How we will retrieve the current value of this cell through closure
  const getValue = () => value;

  return {
    addToken,
    getValue
  };
}

function checkDirection(board, row, col, rowDir, colDir, token) {
  let count = 1;

  for (let i = 1; i < 3; i++) {
    const r = row + rowDir * i;
    const c = col + colDir * i;
    if (r < 0 || r >= board.length || c < 0 || c >= board[0].length || board[r][c].getValue() !== token) break;
    count++;
  }

  for (let i = 1; i < 3; i++) {
    const r = row - rowDir * i;
    const c = col - colDir * i;
    if (r < 0 || r >= board.length || c < 0 || c >= board[0].length || board[r][c].getValue() !== token) break;
    count++;
  }
  return count >= 3;
}

function checkWin(board, row, col, token) {
  return (
    checkDirection(board, row, col, 1, 0, token) ||  // vertical
    checkDirection(board, row, col, 0, 1, token) ||  // horizontal
    checkDirection(board, row, col, 1, 1, token) ||  // diagonal down-right
    checkDirection(board, row, col, 1, -1, token)    // diagonal down-left
  );
}

/* 
** The GameController will be responsible for controlling the 
** flow and state of the game's turns, as well as whether
** anybody has won the game
*/
function GameController(
  playerOneName = "Player One",
  playerTwoName = "Player Two",
  onGameOver // this variable will notify the DOM when the game is over
) {
  const board = Gameboard();

  const players = [
    {
      name: playerOneName,
      token: "X"
    },
    {
      name: playerTwoName,
      token: "Y"
    }
  ];

  const scores = {
    player1: 0,
    player2: 0,
    draws: 0,
  };

  let gameOver = false; // This will track whether the game is over and prevent further moves

  let activePlayer = players[0];

  const switchPlayerTurn = () => {
    activePlayer = activePlayer === players[0] ? players[1] : players[0];
  };
  const getActivePlayer = () => activePlayer;

  const printNewRound = () => {
    board.printBoard();
    console.log(`${getActivePlayer().name}'s turn.`); //
  };

  // Reset the "game state"
  const resetGame = () => {
    board.resetBoard(); //reset all cells
    activePlayer = players[0]; //reset to player one
    gameOver = false;
    printNewRound(); //print empty board and whose turn it is
  };

  const playRound = (row, column) => {
    // Check if the game is done
    if (gameOver) {
      console.log("Game is already over. Reset to play again.");
      return;
    }

    // Check if the cell is already filled
    if (board.getBoard()[row][column].getValue() !== "-") {
      console.log("That spot is already taken!");
      return;
    }

    // Drop a token for the current player
    console.log(`Dropping ${getActivePlayer().name}'s token into column ${column}...`);
    board.makeMove(row, column, getActivePlayer().token);

    /*  This is where we would check for a winner and handle that logic,
        such as a win message. */

    // You should place methods (board.getBoard() and getActivePlayer()) in here b/c it will use the current
    // game state, so it can correctly check the tokens next to the ones just dropped.
    if (checkWin(board.getBoard(), row, column, getActivePlayer().token)) { 
      console.log(`🎉 ${getActivePlayer().name} wins!`);
      gameOver = true;

      if (activePlayer === players[0]) {
        scores.player1++;
      } else {
        scores.player2++;
      }

      onGameOver?.('win', getActivePlayer().name, scores); // notify UI, onGameOver?() means "call onGameOver() if it exist".
      return;
    }

    // Same reason above for board.getBoard()
    if (board.getBoard().flat().every(cell => cell.getValue() !== "-")) {
      console.log("It's a draw!");
      gameOver = true;
      scores.draws++;
      onGameOver?.('draw', null, scores); // notify UI, onGameOver?() means "call onGameOver() if it exist".
      return;
    } 

    // Switch player turn
    switchPlayerTurn();
    printNewRound();
  };

  // Initial play game message
  printNewRound();

  // For the console version, we will only use playRound, but we will need
  // getActivePlayer for the UI version, so I'm revealing it now
  return {
    playRound,
    getActivePlayer,
    getBoard: board.getBoard,
    resetGame,
    getScore: () => scores // expose scores for reading
  };
}

function ScreenController() {
  const playerTurnDiv = document.querySelector('.turn');
  const boardDiv = document.querySelector('.board');
  const resetBtn = document.getElementById('resetBtn');
  const player1ScoreP = document.getElementById('scoreOne');
  const player2ScoreP = document.getElementById('scoreTwo');
  const drawsP = document.getElementById('scoreDraws');

  // This is a callback function to communicate between the logic and the DOM when a win or a draw happens
  const handleGameOver = (result, winnerName, scores) => {
    if (result === "win") {
      playerTurnDiv.textContent = `${winnerName} wins!`;
    } else if (result = "draw") {
      playerTurnDiv.textContent = `It's a draw!`;
    }

    // Update score UI
    player1ScoreP.textContent = `${scores.player1}`;
    drawsP.textContent = `${scores.draws}`;
    player2ScoreP.textContent = `${scores.player2}`;

    resetBtn.style.display = "inline-block";
    disableBoard();
  };
  
  const game = GameController("Player 1", "Player 2", handleGameOver);

  const updateScreen = () => {
    // clear the board
    boardDiv.textContent = "";

    // get the newest version of the board and player turn
    const board = game.getBoard(); //getBoard() belongs to the Gameboard() function, not GameController() function. However, 
    //getBoard() was mutated from the Gameboard() in the GameController()'s return, so you can use this syntax OK.
    //If it wasn't in the return, I don't think you can use it. If you wanted to use it, you need to create
    //a new variable for Gameboard() like "const game1 = Gameboard();"
    const activePlayer = game.getActivePlayer();

    // Display player's turn
    playerTurnDiv.textContent = `${activePlayer.name}'s turn...`

    // Render board squares
    board.forEach((row, rowIndex) => { //rowIndex represents the array index
      row.forEach((cell, columnIndex) => { //columnIndex represents the array index
        // Anything clickable should be a button!!
        const cellButton = document.createElement("button");
        cellButton.classList.add("cell");
        // Create a data attribute to identify the column
        // This makes it easier to pass into our `playRound` function 
        cellButton.dataset.row = rowIndex;
        cellButton.dataset.column = columnIndex;
        cellButton.textContent = cell.getValue();
        boardDiv.appendChild(cellButton);
      })
    })
    // Immediately attach event listeners inside updateScreen()
    // This ensures you attach listeners only after the .cell buttons have been created.
    const cells = document.querySelectorAll(".cell");
    cells.forEach(item => {
      item.addEventListener("click", clickHandlerBoard);
  });
  }

  // Add event listener for the board
  function clickHandlerBoard(e) {
    const selectedRow = parseInt(e.target.dataset.row); //the value from the data attribute is string, so we need to convert it to number to work with
    const selectedColumn = parseInt(e.target.dataset.column); //the value from the data attribute is string, so we need to convert it to number to work with
    // Make sure I've clicked a column and not the gaps in between
    // if (!selectedColumn) return; (delete b/c I added event listener to the cell button)
    
    game.playRound(selectedRow, selectedColumn);
    updateScreen();
  }
  // boardDiv.addEventListener("click", clickHandlerBoard); (delete b/c I added event listener to the cell button)
  function disableBoard() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => cell.disabled = true);
  }

  // Add resetBtn listener
  resetBtn.addEventListener("click", () => {
    game.resetGame();
    updateScreen();
    resetBtn.style.display = 'none';
  });

  // Initial render
  updateScreen();

  // We don't need to return anything from this module because everything is encapsulated inside this screen controller.
}

ScreenController();