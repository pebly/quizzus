import React, { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import CookieWorker from './../workers/cookie';
import {
    Container, Typography, Box, Button, Grid, TextField, Select, MenuItem, FormControl, InputLabel, List, ListItem, Paper, Divider, CircularProgress
} from '@mui/material';

const io = require('socket.io-client');
const serverUrl = 'http://localhost:5000';

const Game = () => {
    const { id } = useParams();
    const socketRef = useRef(null);

    const [players, setPlayers] = useState([]);
    const [hasStarted, setHasStarted] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [gameTime, setGameTime] = useState(0);
    const [inviteCode, setInviteCode] = useState('');
    const [gameEnded, setGameEnded] = useState(false);

    const [currentQuestion, setCurrentQuestion] = useState({
        question: null,
        questionType: null,
        questionAnswers: []
    });

    const [toggledStates, setToggledStates] = useState([false, false, false, false]);
    const [currentLoadedEndQuestion, setCurrentLoadedEndQuestion] = useState(null);
    const [currentLoadedIndividualAnswer, setCurrentLoadedIndividualAnswer] = useState(null);
    const [inputResponse, setInputResponse] = useState('');

    const [settings, setSettings] = useState({
        numberOfQuestions: 3,
        timePerQuestion: 60,
        language: 'English',
        subject: 'General Knowledge',
        source: 'AI'
    });

    const handleToggle = (index) => {
        setToggledStates(prevStates => {
            const newStates = [...prevStates];
            newStates[index] = !newStates[index];
            return newStates;
        });
    };

    const handleInputResponse = (event) => {
        setInputResponse(event.target.value);
    };

    useEffect(() => {
        if (!socketRef.current) {
            socketRef.current = io(`${serverUrl}/lobby-${id}`);
        }

        const socket = socketRef.current;
        if (!socket || socket.connected) return;

        console.log(`Attempting to connect to namespace: ${socket.nsp}`);
        socket.connect();
        console.log('Connection attempted.');

        socket.on('connect', () => console.log(`User connected to namespace: ${socket.nsp}`));

        socket.on('disconnect', () => console.log(`Disconnected from lobby ${id}`));

        socket.on('updatePlayerList', setPlayers);
        socket.on('updateTime', setGameTime);
        socket.on('endGame', () => setGameEnded(true));
        socket.on('loadQuestionEnd', setCurrentLoadedEndQuestion);
        socket.on('loadQuestionIndividualAnswer', setCurrentLoadedIndividualAnswer);

        socket.on('validated', (arg) => {
            if (arg) {
                console.log('User validated');
            } else {
                console.log('User failed to validate');
                socket.disconnect();
            }
        });

        socket.on('loadQuestion', (arg) => {
            console.log(arg);
            setToggledStates([false, false, false, false]);
            setCurrentQuestion(arg);
        });

        socket.on('isAdmin', (arg) => {
            setIsAdmin(arg.isAdmin);
            setInviteCode(arg.inviteCode);
        });

        socket.on('gameStarted', (arg) => {
            if (arg) {
                setHasStarted(arg);
            }
        });

        socket.on('message', (msg) => console.log(`Message received: ${msg}`));

        socket.emit('validate', CookieWorker.getCookie('UserId'));

        return () => {
            console.log('Cleaning up socket listeners');
            socket.off('connect');
            socket.off('disconnect');
            socket.off('message');
            socket.disconnect();
        };
    }, [id]);

    const handleSubmit = () => {
        const socket = socketRef.current;
        if (socket) {
            socket.emit('submitQuestion', { answers: toggledStates, response: inputResponse });
        }
    };

    const speak = (text) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onend = () => console.log('SpeechSynthesisUtterance.onend');
        utterance.onerror = (event) => console.error('SpeechSynthesisUtterance.onerror', event);
        speechSynthesis.speak(utterance);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSettings(prevSettings => ({ ...prevSettings, [name]: value }));
    };

    const handleStartGame = () => {
        socketRef.current.emit('startGame', settings);
    };

    useEffect(() => {
        if (currentLoadedIndividualAnswer && currentLoadedEndQuestion?.questionType === 'response') {
            const playerName = players.find(x => x.socketId === currentLoadedIndividualAnswer.socketId).name;
            const responseText = `${playerName} answered: ${currentLoadedIndividualAnswer.questionResponse}`;
            speak(responseText);
        }
    }, [currentLoadedIndividualAnswer, currentLoadedEndQuestion, players]);

    return (
        <Container maxWidth="md" sx={{ mt: 4 }}>
            <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                        <Box>
                            <Typography variant="h5" gutterBottom>Lobby</Typography>
                            <List>
                                {players.map((player, index) => (
                                    <ListItem key={index}>
                                        {player.name} {player.isAdmin && (<strong style={{ color: 'green' }}>&nbsp;(VIP)</strong>)}
                                    </ListItem>
                                ))}
                            </List>
                        </Box>
                    </Grid>

                    <Divider orientation="vertical" flexItem sx={{ my: 2 }} />

                    {hasStarted && !gameEnded && (
                        <Grid item xs={12} md={7}>
                            <Box>
                                <Typography variant="h5" gutterBottom>{currentQuestion.question}</Typography>
                                <Typography variant="body1" sx={{ mb: 2 }}>Time Left: {gameTime}</Typography>
                                <Grid container spacing={2}>
                                    {currentQuestion.questionAnswers.map((answer, index) => (
                                        <Grid item xs={12} sm={6} key={index}>
                                            <Button
                                                fullWidth
                                                variant="contained"
                                                onClick={() => handleToggle(index)}
                                                style={{ backgroundColor: toggledStates[index] ? 'green' : '#002884' }}
                                            >
                                                {answer}
                                            </Button>
                                        </Grid>
                                    ))}
                                </Grid>
                                {currentQuestion.questionType === 'response' && (
                                    <Box textAlign="center" mt={3}>
                                        <TextField
                                            id="input-field"
                                            label="Enter..."
                                            variant="filled"
                                            value={inputResponse}
                                            onChange={handleInputResponse}
                                            fullWidth
                                        />
                                    </Box>
                                )}
                                <Button variant="contained" color="primary" fullWidth sx={{ mt: 3 }} onClick={handleSubmit}>
                                    Submit
                                </Button>
                            </Box>
                        </Grid>
                    )}

                    {!hasStarted && !gameEnded && !isAdmin && (
                        <Grid item xs={12}>
                            <Box textAlign="center" mt={3}>
                                <CircularProgress />
                                <Typography variant="h6" sx={{ mt: 2 }}>Waiting for host to start...</Typography>
                            </Box>
                        </Grid>
                    )}

                    {!hasStarted && !gameEnded && isAdmin && (
                        <Grid item xs={12} md={7}>
                            <Box>
                                <Typography variant="h5" gutterBottom>Game Settings</Typography>
                                <Box sx={{ mt: 2 }}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        name="numberOfQuestions"
                                        label="Number of Questions"
                                        value={settings.numberOfQuestions}
                                        onChange={handleChange}
                                        sx={{ mb: 2 }}
                                    />
                                    <TextField
                                        fullWidth
                                        type="number"
                                        name="timePerQuestion"
                                        label="Time per Question (seconds)"
                                        value={settings.timePerQuestion}
                                        onChange={handleChange}
                                        sx={{ mb: 2 }}
                                    />
                                    <FormControl fullWidth sx={{ mb: 2 }}>
                                        <InputLabel id="language-label">Language</InputLabel>
                                        <Select
                                            labelId="language-label"
                                            id="language-select"
                                            name="language"
                                            value={settings.language}
                                            onChange={handleChange}
                                            label="Language"
                                        >
                                            <MenuItem value="English">English</MenuItem>
                                            <MenuItem value="Spanish">Spanish</MenuItem>
                                            <MenuItem value="French">French</MenuItem>
                                            <MenuItem value="German">German</MenuItem>
                                            <MenuItem value="Chinese">Chinese</MenuItem>
                                        </Select>
                                    </FormControl>

                                    <TextField
                                        fullWidth
                                        name="subject"
                                        label="Subject"
                                        value={settings.subject}
                                        onChange={handleChange}
                                        sx={{ mb: 2 }}
                                    />
                                    <FormControl fullWidth sx={{ mb: 2 }}>
                                        <InputLabel id="source-label">Source</InputLabel>
                                        <Select
                                            labelId="source-label"
                                            id="source-select"
                                            name="source"
                                            value={settings.source}
                                            onChange={handleChange}
                                            label="Source"
                                        >
                                            <MenuItem value="AI">AI</MenuItem>
                                            <MenuItem value="EXTERN">EXTERN</MenuItem>
                                        </Select>
                                    </FormControl>

                                    <Button
                                        variant="contained"
                                        color="primary"
                                        fullWidth
                                        onClick={handleStartGame}
                                    >
                                        Start Game
                                    </Button>
                                    <Box textAlign="center" mt={3}>
                                        <Typography variant="body1">
                                            Invite your friends with this code:
                                        </Typography>
                                        <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
                                            <Link to={`/lobby/${inviteCode}`}>{`www.quizzus.ro/lobby/${inviteCode}`}</Link>
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </Grid>
                    )}

                    {gameEnded && currentLoadedEndQuestion && (
                        <Grid item xs={12}>
                            <Box textAlign="center" mt={3}>
                                <Typography variant="h6" sx={{ mt: 2 }}>Game Over! Reviewing Answers...</Typography>
                                <Typography variant="h5" sx={{ mt: 2 }}>{currentLoadedEndQuestion.question}</Typography>
                                {currentLoadedEndQuestion.questionType === 'checkbox' ? (
                                    currentLoadedEndQuestion.questionAnswers.map((answer, index) => (
                                        <Box key={index}>
                                            <Typography
                                                variant="body1"
                                                color={currentLoadedEndQuestion.correctAnswersIndexes.includes(index) ? 'green' : 'gray'}
                                            >
                                                {answer}
                                            </Typography>
                                        </Box>
                                    ))
                                ) : (
                                    <Typography variant="body1" sx={{ mt: 2 }}>
                                        {players.find(x => x.socketId === currentLoadedIndividualAnswer?.socketId)?.name} answered: {currentLoadedIndividualAnswer?.questionResponse}
                                    </Typography>
                                )}
                            </Box>
                        </Grid>
                    )}
                </Grid>
            </Paper>
        </Container>
    );
};

export default Game;
