const { v4: uuidv4 } = require('uuid');
const socketIo = require('socket.io');
const express = require('express');
const http = require('http');
const GPTService = require('./../services/gptService');

const db = require('./databaseModel');
const jwtService = require('./../services/tokenService')

class LobbyModel {
    constructor(io) {
        if (LobbyModel.instance) {
            return LobbyModel.instance;
        }

        this.lobbies = new Map();
        this.io = io;
        LobbyModel.instance = this;
    }

    async createLobby(adminId, username, callback) {
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
                    source: '',
                    maxPlayers: 8,
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
                        },
                        score: 0,
                    }
                ],
                hasStarted: false,
                questionData: null,
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
                for (const [i, questionData] of lobby.questionData.entries()) {
                    const currentQuestionSubmits = lobby.allSubmits.filter(submit => submit.questionIndex === i);
            
                    for (const submit of currentQuestionSubmits) {
                        let gptResponse = '';
                        let parsedResponse = {};
            
                        if (questionData.questionType !== 'checkbox') {
                            try {
                                gptResponse = await GPTService.evaluateAnswer(
                                    questionData.question,
                                    submit.questionResponse,
                                    questionData.questionType,
                                    questionData.personality
                                );
                               
                                parsedResponse = typeof gptResponse === 'string' ? JSON.parse(gptResponse) : JSON.parse(gptResponse);
                                parsedResponse = JSON.parse(parsedResponse);
                            } catch (error) {
                                console.error('Error parsing or evaluating GPT response:', error);
                                parsedResponse = {}; 
                            }
                        }
            
                        let correctness = parseFloat(parsedResponse.correctness) || 0;
                        let personality = parseFloat(parsedResponse.personality) || 0;
            
                        console.log(typeof parsedResponse);
                        console.log('Parsed Response:', parsedResponse);
                        console.log('Correctness:', correctness);
                        console.log('Personality:', personality);

                        socket.emit('loadQuestionEnd', questionData);
                        if (questionData.questionType !== 'checkbox') {
                            socket.emit('loadQuestionIndividualAnswer', { submit: submit, gpt: parsedResponse });
                            await sleep(5000);
                        } else {
                            socket.to(submit.socketId).emit('loadQuestionIndividualAnswer', { submit: submit, gpt: null });
                        }
            
                        const player = lobby.players.find(player => player.socketId === submit.socketId);
                        if (player && Array.isArray(questionData.correctAnswersIndexes)) {
                            if (questionData.questionType === 'checkbox') {
                                player.score += (questionData.correctAnswersIndexes.includes(i) && submit.questionAnswers[i] === true) ? 25 : -25;
                            } else if (questionData.questionType === 'response') {
                                player.score += correctness * 5;
                            } else {
                                player.score += correctness * 2.5 + personality * 2.5;
                            }
                            console.log(`I modified score of ${player.name} with: ${correctness * 5}\n`);
                            correctness = personality = 0;
                            socket.emit('updatePlayerList', lobby.players);
                        }
                    }
            
                    if (questionData.questionType === 'checkbox') await sleep(5000);
                }
            }
            
            const lobbyNamespace = this.io.of(`/lobby-${lobbyId}`);
            lobby.namespace = lobbyNamespace;


            lobbyNamespace.on('connection', async (socket) => {
                console.log(`User with id: ${socket.id} connected to lobby ${lobbyId}`);

                socket.on('disconnect', () => {
                    let disconnectedUser = lobby.players.find(player => player.socketId === socket.id);
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

                });

                socket.on('submitQuestion', async (arg) => {
                    if (!lobby.currentGivenSubmits.find(submit => submit.socketId === socket.id)) {
                        const submitValue = {
                            socketId: socket.id,
                            questionIndex: lobby.currentRoundQuestion,
                            questionAnswers: arg.answers,
                            questionResponse: arg.response
                        };
                        lobby.currentGivenSubmits.push(submitValue);
                        if(arg.jwt != null)
                        {
                            db.insertQuestion(jwtService.verifyToken(arg.jwt).data, lobby.questionData[lobby.currentRoundQuestion], submitValue);
                        }
                        lobby.allSubmits.push(submitValue);
                    }

                    if (lobby.currentGivenSubmits.length === lobby.players.length) {
                        lobby.currentGivenSubmits = [];
                        lobby.currentRoundTime = 0;
                    }
                });

                socket.on('startGame', async (arg) => {
                    if (lobby.players.find(player => player.socketId === socket.id && player.isAdmin === true)) {
                        lobby.hasStarted = true;
                        lobby.settings = arg;
                        lobby.currentRoundTime = lobby.settings.timePerQuestion;

                        

                        try {
                            const response = await GPTService.generateQuestion(lobby.settings);
                            const parsedResponse = typeof response === 'string' ? JSON.parse(response) : response;
                            lobby.questionData = parsedResponse.questionData;
                            lobbyNamespace.emit('loadQuestion', lobby.questionData.map(({ correctAnswersIndexes, ...rest }) => rest)[lobby.currentRoundQuestion]);
                        } catch (error) {
                            console.error('Error generating questions:', error);
                        }

                        lobbyNamespace.emit('gameStarted', true);
                        lobbyNamespace.emit('updateTime', lobby.currentRoundTime);

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
                                        await calculateScores(lobbyNamespace);
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

                socket.on('validate', async (arg) => {
                    let foundPlayer = lobby.players.find(player => player.id == arg);
                    if (foundPlayer != null) {
                        foundPlayer.socketId = socket.id;
                        socket.emit('validated', true);
                        if (foundPlayer.isAdmin === true) {
                            socket.emit('isAdmin', { isAdmin: true, inviteCode: lobby.inviteCode });
                        }
                        lobbyNamespace.emit('updatePlayerList', lobby.players);
                    } else {
                        socket.emit('validated', false);
                    }
                });

                socket.on('message', (msg) => {
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

    async joinPrivateLobby(uuid, username, inviteCode, callback) {
        try {
            const foundLobby = Array.from(this.lobbies.values()).find((lobby) => lobby.inviteCode === inviteCode);
            if (foundLobby) {
                foundLobby.players.push({
                    name: username,
                    id: uuid,
                    isAdmin: false,
                    data: {
                        score: 0,
                        hasAnswered: false
                    },
                    score: 0
                });
                const response = { id: foundLobby.id };
                callback(null, response);
            } else {
                callback(null, null); 
            }
        } catch (error) {
            callback(error);
        }
    }
    
    async joinRandomLobby(uuid, username, callback) {
        try {
            const foundLobbies = this.getLobbies().filter((lobby) => lobby.players.length < lobby.settings.maxPlayers);
            if (foundLobbies.length === 0) {
                callback(null, null);
                return;
            }
            const foundLobby = foundLobbies[Math.floor(Math.random() * foundLobbies.length)];
            if (foundLobby) {
                foundLobby.players.push({
                    name: username,
                    id: uuid,
                    isAdmin: false,
                    data: {
                        score: 0,
                        hasAnswered: false
                    },
                    score: 0
                });
                const response = { id: foundLobby.id };
                callback(null, response);
            } else {
                callback(null, null);
            }
        } catch (error) {
            callback(error);
        }
    }

    getLobby(lobbyId) {
        return this.lobbies.get(lobbyId);
    }

    async updateSettings(lobbyId, newSettings, playerName) {
        const lobby = this.getLobby(lobbyId);
        if (lobby && lobby.admin === playerName) {
            lobby.settings = { ...lobby.settings, ...newSettings };
            return true;
        }
        return false;
    }

    async removeLobby(lobbyId) {
        this.lobbies.delete(lobbyId);
    }

    getLobbies() {
        return Array.from(this.lobbies.values());
    }
}

module.exports = (io) => new LobbyModel(io);
