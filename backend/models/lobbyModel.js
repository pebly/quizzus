const { v4: uuidv4 } = require('uuid');
const socketIo = require('socket.io');
const express = require('express');
const http = require('http');

class LobbyManager {
    constructor(io) {
        if (LobbyManager.instance) {
            return LobbyManager.instance;
        }
        this.lobbies = new Map();
        this.io = io;
        LobbyManager.instance = this;
    }

    createLobby(adminId, username, callback) {
        try {
            console.log("LOBBY CREATED");
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
                        socketId: null,
                    },
                ],

                hasStarted: false,
                questionData: 
                {
                    question: null,
                    questionType: null,
                    questionAnswers: null,
                }

                
                
            };

            const lobbyNamespace = this.io.of(`/lobby-${lobbyId}`);
            lobby.namespace = lobbyNamespace; 
            console.log(lobby.inviteCode);
            lobbyNamespace.on('connection', (socket) => {
                console.log(`User with id: ${socket.id} connected to lobby ${lobbyId}`);

                socket.on('disconnect', () => {
                    console.log(`User disconnected from lobby ${lobbyId}\n`);
                    lobby.players = lobby.players.filter(player => player.socketId !== socket.id);
                    lobbyNamespace.emit('updatePlayerList', lobby.players);
                });

                socket.on('validate', (arg) => 
                {
                    let foundPlayer = lobby.players.find(player => player.id == arg);
                    if(foundPlayer != null)
                    {
                        console.log(`User with id: ${arg} validated`);
                        foundPlayer.socketId = socket.id;
                        socket.emit('validated', true);
                        lobbyNamespace.emit('updatePlayerList', lobby.players);
                    }
                    else
                    {
                        console.log(`User with id: ${arg} failed to validate`);
                        socket.emit('validated', false);
                    }
                });

                socket.on('message', (msg) => {
                    console.log(`Received from ${socket.id} the message: ${msg}`);
                    lobbyNamespace.emit('message', msg);
                });
            });
    
            this.lobbies.set(lobbyId, lobby);
            const response =
                {
                    id: lobby.id,
                };
            callback(null, response);
        } catch (error) {
            console.log(error);
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
                const response =
                {
                    id: foundLobby.id,
                };
                callback(null, response)
            }
            else
                callback(null, response);
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

module.exports = (io) => new LobbyManager(io);
