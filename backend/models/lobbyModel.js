const { v4: uuidv4 } = require('uuid');
const socketIo = require('socket.io');
const express = require('express');
const http = require('http');
const GPTService = require('./../services/gptService');

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
            const lobbyId = uuidv4();
            const lobby = {
                id: lobbyId,
                inviteCode: parseInt(lobbyId, 16).toString(36).toUpperCase().padStart(7, '0'),
                settings: {
                    numberOfQuestions: 0,
                    timePerQuestion: 0,
                    language: '',
                    subject: '',
                    source: ''
                },
                players: [
                    {
                        name: username,
                        id: adminId,
                        isAdmin: true,
                        socketId: 0,
                        data: {
                            score: 0,
                            hasAnswered: false
                        }
                    }
                ],
                hasStarted: false,
                questionData: [
                    {
                        question: null,
                        questionType: null,
                        questionAnswers: [],
                        correctAnswersIndexes: []
                    }
                ],
                currentRoundQuestion: 0,
                currentRoundTime: 0,
                currentRoundTimer: null,
                currentGivenSubmits: [],
                allSubmits: [],
                finalScores: [],
                endGameInterval: null
            };

            function sleep(ms) {
                return new Promise(resolve => setTimeout(resolve, ms));
            }

            async function calculateScores(socket) {
                for (const [i, e] of lobby.questionData.entries()) {
                    const currentQuestionSubmits = lobby.allSubmits.filter(submit => submit.questionIndex === i);
                    socket.emit('loadQuestionEnd', e);
                    for (const submit of currentQuestionSubmits) {
                        socket.emit('loadQuestionIndividualAnswer', submit);
                        if (e.questionType === 'response') await sleep(5000);
                    }
                    if (e.questionType !== 'response') await sleep(5000);
                }
            }

            const lobbyNamespace = this.io.of(`/lobby-${lobbyId}`);
            lobby.namespace = lobbyNamespace;

            console.log(lobby.inviteCode);

            lobbyNamespace.on('connection', (socket) => {
                console.log(`User with id: ${socket.id} connected to lobby ${lobbyId}`);

                socket.on('disconnect', () => {
                    let disconnectedUser = lobby.players.find(player => player.socketId === socket.id);
                    console.log(socket);
                    console.log(`User disconnected from lobby ${lobbyId}\n`);

                    let adminDisconnected = false;
                    if (disconnectedUser) {
                        adminDisconnected = disconnectedUser.isAdmin === true;
                    }

                    lobby.players = lobby.players.filter(player => player.socketId !== socket.id);

                    if (lobby.players.length >= 1) {
                        if (adminDisconnected) {
                            lobby.players[0].isAdmin = true;
                            socket.to(lobby.players[0].socketId).emit('isAdmin', true);
                        }
                        lobbyNamespace.emit('updatePlayerList', lobby.players);
                    } else {
                        lobbyNamespace.emit('disconnectAll');
                    }

                    console.log(lobby.players);
                });

                socket.on('submitQuestion', (arg) => {
                    if (!lobby.currentGivenSubmits.find(submit => submit.socketId === socket.id)) {
                        const submitValue = {
                            socketId: socket.id,
                            questionIndex: lobby.currentRoundQuestion,
                            questionAnswers: arg.answers,
                            questionResponse: arg.response
                        };
                        lobby.currentGivenSubmits.push(submitValue);
                        lobby.allSubmits.push(submitValue);
                    }

                    if (lobby.currentGivenSubmits.length === lobby.players.length) {
                        lobby.currentGivenSubmits = [];
                        lobby.currentRoundTime = 0;
                    }
                });

                socket.on('startGame', (arg) => {
                    if (lobby.players.find(player => player.socketId === socket.id && player.isAdmin === true)) {
                        lobby.hasStarted = true;
                        lobby.settings = arg;
                        lobby.currentRoundTime = lobby.settings.timePerQuestion;

                        lobbyNamespace.emit('gameStarted', true);
                        lobbyNamespace.emit('updateTime', lobby.currentRoundTime);

                        GPTService.generateQuestion(lobby.settings)
                            .then((response) => {
                                lobby.questionData = response.questionData;
                                lobbyNamespace.emit('loadQuestion', lobby.questionData.map(({ correctAnswersIndexes, ...rest }) => rest)[lobby.currentRoundQuestion]);
                            })
                            .catch((error) => {
                                console.error('Error generating questions:', error);
                            });

                        clearInterval(lobby.currentRoundTimer);
                        lobby.currentRoundTimer = null;

                        lobby.currentRoundTimer = setInterval(async () => {
                            if (lobby.hasStarted) {
                                if (lobby.currentRoundTime > 0) {
                                    lobby.currentRoundTime--;
                                } else {
                                    if (lobby.currentRoundQuestion === lobby.settings.numberOfQuestions - 1) {
                                        clearInterval(lobby.currentRoundTimer);
                                        lobby.currentRoundTimer = null;
                                        lobbyNamespace.emit('endGame');
                                        calculateScores(lobbyNamespace);
                                    } else {
                                        lobby.currentRoundTime = lobby.settings.timePerQuestion;
                                        lobby.currentGivenSubmits = [];
                                        lobbyNamespace.emit('loadQuestion', lobby.questionData.map(({ correctAnswersIndexes, ...rest }) => rest)[++lobby.currentRoundQuestion]);
                                    }
                                }

                                lobbyNamespace.emit('updateTime', lobby.currentRoundTime);
                            }
                        }, 1000);
                    }
                });

                socket.on('validate', (arg) => {
                    let foundPlayer = lobby.players.find(player => player.id == arg);
                    if (foundPlayer != null) {
                        console.log(`User with id: ${arg} validated`);
                        foundPlayer.socketId = socket.id;
                        socket.emit('validated', true);
                        if (foundPlayer.isAdmin === true) {
                            socket.emit('isAdmin', { isAdmin: true, inviteCode: lobby.inviteCode });
                        }
                        lobbyNamespace.emit('updatePlayerList', lobby.players);
                    } else {
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
            const response = { id: lobby.id };
            callback(null, response);
        } catch (error) {
            console.log(error);
            callback(error);
        }
    }

    joinPrivateLobby(uuid, username, inviteCode, callback) {
        try {
            const foundLobby = Array.from(this.lobbies.values()).find((lobby) => lobby.inviteCode === inviteCode);
            console.log(foundLobby);
            if (foundLobby) {
                foundLobby.players.push({
                    name: username,
                    id: uuid,
                    isAdmin: false,
                    data: {
                        score: 0,
                        hasAnswered: false
                    }
                });
                const response = { id: foundLobby.id };
                callback(null, response);
            } else {
                callback(null, {});
            }
        } catch (error) {
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