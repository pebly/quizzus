import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import CookieWorker from './../workers/cookie';


const io = require('socket.io-client');
const serverUrl = 'http://localhost:5000';

const Game = () => {
    const { id } = useParams();

    const socketRef = useRef(null);

    const [players, setPlayers] = useState([]);

    useEffect(() => {
        if(!socketRef.current)
        {
            socketRef.current = io(`${serverUrl}/lobby-${id}`);
        }

        const socket = socketRef.current;

        if (!socket || socket.connected === true) return;
        
        console.log(`Attempting to connect to namespace: ${socket.nsp}`);
        socket.connect();
        console.log('Connection attempted.')

        socket.on('connect', () => {
            console.log(`User connected to namespace: ${socket.nsp}`);
        });

        socket.on('disconnect', () => {
            console.log(`Disconnected from lobby ${id}`);
        });

        socket.on('updatePlayerList', (arg) => {
            setPlayers(arg);
        });

        socket.on('validated', (arg) => {
            if(arg)
            {
                console.log('User validated');
            }
            else
            {
                console.log('User failed to validate');
                socket.disconnect();
            }
        })

        socket.on('message', (msg) => {
            console.log(`Message received: ${msg}`);
        });

        socket.emit('validate', CookieWorker.getCookie('UserId'));

        return () => {
            console.log('Cleaning up socket listeners');
            socket.off('connect');
            socket.off('disconnect');
            socket.off('message');
            socket.disconnect();
        };

    }, []);  

    const handleSubmit = () => 
    {
        const socket = socketRef.current;
        if(socket)
        {
            socket.emit('message', 'has pressed submit!');
        }
    }


    return (
        <div className="game-container">
            <div className="lobby-section">
                <h2>Lobby</h2>
                <ul>
                {players.map((player, index) => (
                    <li key={index}>{player.name}</li>
                ))}
            </ul>
            </div>

            <div className="question-section">
                <h1>What is the capital of France?</h1>
                <div className="timer">
                    Time Left: 30s
                </div>
                <div className="answers">
                    <button>
                        Paris
                    </button>
                    <button>
                        London
                    </button>
                    <button>
                        Berlin
                    </button>
                    <button>
                        Madrid
                    </button>
                    <button>
                        Rome
                    </button>
                </div>
                <button onClick = {handleSubmit}>
                    Submit
                </button>
            </div>

            <div className="score-section">
                <h2>Scores</h2>
                <ul>
                    <li>Player 1: 10</li>
                    <li>Player 2: 8</li>
                    <li>Player 3: 5</li>
                </ul>
            </div>
        </div>
    );
};

export default Game;
