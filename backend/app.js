const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const bodyParser = require('body-parser');
const database = require('./database');

const createLobbyManager = require('./models/lobbyModel');
const AuthentificationModel = require('./models/authentificationModel'); 

const gpt = require('./services/gptService');

const app = express();

app.use(cors());
app.use(bodyParser.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {origin:"http://localhost:3000", methods: ["GET", "POST"]},
});

const lobbyModel = createLobbyManager(io);
const authentificationModel = new AuthentificationModel(); 
const gameRoutes = require('./routes/gameRoutes')(lobbyModel, authentificationModel);

app.use('/api', gameRoutes);

app.get('/', (req, res) => {
    res.send('Server is running');
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});