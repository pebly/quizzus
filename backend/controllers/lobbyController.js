
const LobbyController = {
    createLobby: async (req, res, LobbyModel) => {
        const { uuid, username } = req.body;
        LobbyModel.createLobby(uuid, username, (err, response) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(response);
        });
    },

    joinRandomLobby: async (req, res, LobbyModel) => {
        const { uuid, username } = req.body;
        LobbyModel.joinRandomLobby(uuid, username, (err, response) => {
            if (err) return res.status(500).json({ error: err.message });
            if (response === null) return res.status(204).json({message: 'No lobbies found!'});
            res.json(response);
        });
    },

    joinPrivateLobby: async (req, res, LobbyModel) => {
        const { uuid, username, inviteCode } = req.body;
        LobbyModel.joinPrivateLobby(uuid, username, inviteCode, (err, response) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(response);
        });
    },

    getLobbyById: async (req, res, LobbyModel) => {
        const gameId = req.params.id;
        LobbyModel.getLobby((err, lobby) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(lobby);
        });
    },

};

module.exports = LobbyController;
