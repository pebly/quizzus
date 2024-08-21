
const LobbyController = {
    createLobby: (req, res, lobbyManager) => {
        const { uuid, username } = req.body;
        lobbyManager.createLobby(uuid, username, (err, response) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(response);
        });
    },

    joinRandomLobby: (req, res, lobbyManager) => {
        const { uuid, username } = req.body;
        lobbyManager.joinRandomLobby(uuid, username, (err, response) => {
            if (err) return res.status(500).json({ error: err.message });
            if (response === null) return res.status(204).json({message: 'No lobbies found!'});
            res.json(response);
        });
    },

    joinPrivateLobby: (req, res, lobbyManager) => {
        const { uuid, username, inviteCode } = req.body;
        lobbyManager.joinPrivateLobby(uuid, username, inviteCode, (err, response) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(response);
        });
    },

    getLobbyById: (req, res, lobbyManager) => {
        const gameId = req.params.id;
        lobbyManager.getLobby((err, lobby) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(lobby);
        });
    },

};

module.exports = LobbyController;
