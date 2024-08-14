const { v4: uuidv4 } = require('uuid');

class LobbyManager {
    constructor() {
        if (LobbyManager.instance) {
            return LobbyManager.instance;
        }
        this.lobbies = new Map();
        LobbyManager.instance = this;
    }

    createLobby(adminId, username, callback) {
        try {
            const lobbyId = uuidv4();
            const lobby = {
                id: lobbyId,
                inviteCode: parseInt(lobbyId, 16).toString(36).toUpperCase().padStart(7, '0'),
                settings: null,
                players: [
                    {
                        name: username,
                        id: adminId,
                        isAdmin: true,
                    },
                ],
            };
    
            this.lobbies.set(lobbyId, lobby);
            console.log("Lobby created:", lobby);
            callback(null, lobby);
        } catch (error) {
            callback(error);
        }
    }
    

    joinPrivateLobby(uuid, username, inviteCode, callback) {
        try
        {
            const foundLobby = Array.from(this.lobbies.values()).find((lobby) => lobby.inviteCode === inviteCode);
            console.log(foundLobby);
            if (foundLobby) {
                foundLobby.players.push({ name: username, id: uuid, isAdmin: false });
                callback(null, foundLobby);
            }
            else
                callback(null, null);
        } catch (error)
        {
            callback(error);
        }
    }

    getLobby(lobbyId) {
        return this.lobbies.get(lobbyId);
    }

    updateSettings(lobbyId, newSettings, playerName) {
        const lobby = this.getLobby(lobbyId);
        if (lobby && lobby.admin === playerName) {
            lobby.settings = { ...lobby.settings, ...newSettings };
            return true;
        }
        return false;
    }

    addPlayer(lobbyId, playerName, playerUUID) {
        const lobby = this.getLobby(lobbyId);
        if (lobby) {
            lobby.players.push({ name: playerName, id: playerUUID, isAdmin: false });
            return lobby;
        }
        return null;
    }

    removeLobby(lobbyId) {
        this.lobbies.delete(lobbyId);
    }

    getLobbies() {
        return Array.from(this.lobbies.values());
    }
}

module.exports = new LobbyManager();
