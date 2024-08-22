const express = require('express');
const router = express.Router();
const LobbyController = require('../controllers/lobbyController');
const AuthentificationController = require('../controllers/authentificationController');

module.exports = (lobbyModel, authentificationModel)  => 
{
    const router = express.Router();

    router.post('/game', (req, res) => LobbyController.createLobby(req, res, lobbyModel));
    router.get('/game');
    router.post('/join', (req, res) => LobbyController.joinPrivateLobby(req, res, lobbyModel));
    router.post('/random', (req, res) => LobbyController.joinRandomLobby(req, res, lobbyModel));

    router.post('/register', (req, res) => AuthentificationController.registerUser(req, res, authentificationModel));
    router.post('/login', (req, res) => AuthentificationController.loginUser(req, res, authentificationModel));
    router.post('/logout', (req, res) => AuthentificationController.logoutUser(req, res, authentificationModel));

    router.get('/userInfo', (req, res) => AuthentificationController.userInfo(req, res, authentificationModel));

    return router;
};

