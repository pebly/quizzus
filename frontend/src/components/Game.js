import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const Game = () => {
    return (
        <div className="game-container">
            <div className="lobby-section">
                <h2>Lobby</h2>
                <ul>
                    <li>Player 1 - 0</li>
                    <li>Player 2 - 0</li>
                    <li>Player 3 - 0</li>
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
                <button>
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
