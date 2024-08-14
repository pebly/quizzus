import React, { useState, useEffect} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import CookieWorker from '../workers/cookie';


const LobbyInvite = () => {
    const [userName, setUserName] = useState('');
    const navigate = useNavigate();
    const { id } = useParams();
    const createGame = async () => {
        const response = await axios.post('/api/game', {
            uuid: CookieWorker.getCookie('UserId'),
            username: userName
        });
        navigate(`/play/${response.data.id}`);
    };

    const playGame = async () =>
        {
            const response = await axios.post('/api/join', {
                uuid: CookieWorker.getCookie('UserId'),
                username: userName,
                inviteCode: id
            });
            navigate(`/play/${response.data.id}`);
        }

    useEffect(() => {
    }, []);

    return (
        <div>
            <h1>Welcome to Quizzus!</h1>
            <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Your Name"
            />
            <br></br>
            <button onClick={playGame}>Play</button>
            <button onClick={createGame}>Create Private Game</button>
            {}
        </div>
    );
};

export default LobbyInvite;
