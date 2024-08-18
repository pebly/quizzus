const express = require('express');
const router = express.Router();
const LobbyController = require('../controllers/lobbyController');



module.exports = (lobbyManager) => 
{
    const router = express.Router();

    router.post('/game', (req, res) => LobbyController.createLobby(req, res, lobbyManager));
    router.get('/game');
    router.post('/join', (req, res) => LobbyController.joinPrivateLobby(req, res, lobbyManager));
    router.post('/random', (req, res) => LobbyController.joinRandomLobby(req, res, lobbyManager));

    return router;
};

