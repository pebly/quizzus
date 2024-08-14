import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Lobby from './components/Lobby';
import LobbyInvite from './components/LobbyInvite'
import Game from './components/Game';
import Leaderboard from './components/Leaderboard';
import {v4 as uuid} from 'uuid';
import CookieWorker from './workers/cookie';

const App = () => {
    const [userId, setUserId] = useState('');
    
    useEffect(() => {
        let userId = CookieWorker.setCookie('UserId');
        if(!userId)
        {
            userId = uuid();
            CookieWorker.setCookie('UserId', userId);
        }
    }, []);

    return (
        <Router>
            <Routes>
                <Route path="/" element={<Lobby />} />
                <Route path="/lobby/:id" element={<LobbyInvite />} />
                <Route path="/play/:id" element={<Game />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
            </Routes>
        </Router>
    );
};

export default App;
