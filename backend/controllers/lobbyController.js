const Lobby = require('../models/lobbyModel');

const LobbyController = {
    createLobby: (req, res) => {
        const { uuid, username } = req.body;
        Lobby.createLobby(uuid, username, (err, game) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(game);
        });
    },

    joinRandomLobby: (req, res) => {
        const { uuid, username } = req.body;
        Lobby.joinRandomLobby(uuid, username, (err, game) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(game);
        });
    },

    joinPrivateLobby: (req, res) => {
        const { uuid, username, inviteCode } = req.body;
        Lobby.joinPrivateLobby(uuid, username, inviteCode, (err, lobby) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(lobby);
        });
    },

    getLobbyById: (req, res) => {
        const gameId = req.params.id;
        Lobby.getLobby((err, lobby) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(lobby);
        });
    },

};

module.exports = LobbyController;
