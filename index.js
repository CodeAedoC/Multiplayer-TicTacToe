require('dotenv').config();

const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

const waitingPlayers = new Set();
const activeGames = new Map();
const playerNames = new Map();

io.on('connection', (socket) => {
    socket.on('setName', (name) => {
        playerNames.set(socket.id, name);
        console.log(`Player connected: ${name}`)
    });

    socket.on('findGame', () => {
        if (waitingPlayers.size > 0) {
            const opponent = waitingPlayers.values().next().value;
            waitingPlayers.delete(opponent);

            const roomId = `game-${Date.now()}`;
            activeGames.set(roomId, {
                players: [opponent, socket.id],
                currentPlayer: opponent,
                board: Array(9).fill(''),
                names: {
                    [opponent]: playerNames.get(opponent) || 'Player 1',
                    [socket.id]: playerNames.get(socket.id) || 'Player 2'
                }
            });

            socket.join(roomId);
            io.sockets.sockets.get(opponent)?.join(roomId);

            const game = activeGames.get(roomId);
            io.to(opponent).emit('playerAssignment', { 
                symbol: 'X', 
                isYourTurn: true,
                roomId,
                opponentName: game.names[socket.id]
            });
            socket.emit('playerAssignment', { 
                symbol: 'O', 
                isYourTurn: false,
                roomId,
                opponentName: game.names[opponent]
            });
            io.to(roomId).emit('gameStart');
        } else {
            waitingPlayers.add(socket.id);
            socket.emit('waiting');
        }
    });

    socket.on('cancelSearch', () => {
        waitingPlayers.delete(socket.id);
        socket.emit('searchCancelled');
    });

    socket.on('makeMove', ({ roomId, index }) => {
        const game = activeGames.get(roomId);
        if (!game || game.currentPlayer !== socket.id) return;

        const symbol = game.players[0] === socket.id ? 'X' : 'O';
        game.board[index] = symbol;
        game.currentPlayer = game.players.find(id => id !== socket.id);

        io.to(roomId).emit('updateBoard', {
            board: game.board,
            currentPlayer: game.currentPlayer
        });

        const winner = checkWinner(game.board);
        if (winner) {
            io.to(roomId).emit('gameOver', { 
                winner,
                winnerName: game.names[socket.id]
            });
            activeGames.delete(roomId);
        } else if (!game.board.includes('')) {
            io.to(roomId).emit('gameOver', { winner: 'draw' });
            activeGames.delete(roomId);
        }
    });

    socket.on('disconnect', () => {
        waitingPlayers.delete(socket.id);
        playerNames.delete(socket.id);

        for (const [roomId, game] of activeGames.entries()) {
            if (game.players.includes(socket.id)) {
                io.to(roomId).emit('playerDisconnected', {
                    playerName: game.names[socket.id]
                });
                activeGames.delete(roomId);
            }
        }
    });
});

function checkWinner(board) {
    const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];

    for (const pattern of winPatterns) {
        const [a, b, c] = pattern;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }
    return null;
}

http.listen(process.env.PORT , () => {
    console.log(`Server running on port ${process.env.PORT}`);
});