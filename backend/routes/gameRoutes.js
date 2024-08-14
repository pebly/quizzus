const express = require('express');
const router = express.Router();
const LobbyManager = require('../controllers/lobbyController');

router.post('/game', LobbyManager.createLobby);
router.get('/game');
router.post('/random', LobbyManager.joinRandomLobby);
router.post('/join', LobbyManager.joinPrivateLobby);

// router.get('/game/:id', GameController.getGameById);

module.exports = router;
