# Multiplayer Tic-Tac-Toe Game

This project is a real-time multiplayer **Tic-Tac-Toe game** built using **Node.js**, **Express**, and **Socket.IO**. It allows two players to connect and play a classic game of Tic-Tac-Toe in real-time through a web browser. The game manages **matchmaking**, **turn-taking**, and **game state**, including handling winning conditions and draws.

## Features

- **Real-Time Gameplay:** Players connect and play moves instantly using WebSockets.
- **Automatic Matchmaking:** Players are paired automatically as soon as two are connected.
- **Win/Draw Detection:** The server evaluates the game board to declare a winner or detect a draw.
- **Responsive Design:** Easily accessible and playable through a browser on desktop or mobile.

## Technologies Used

- **Node.js**: Backend server runtime.
- **Express**: Web framework for handling routes and serving static files.
- **Socket.IO**: WebSocket library for real-time, bi-directional communication.
- **HTML/CSS/JavaScript**: Frontend for the game's user interface.
