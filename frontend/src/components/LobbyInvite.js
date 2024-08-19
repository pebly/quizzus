import React, { useState, useEffect} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import CookieWorker from '../workers/cookie';

import { Container, Typography, TextField, Button, Box, Grid, Paper } from '@mui/material';
import { styled } from '@mui/system';

const Background = styled(Box)({
    backgroundImage: 'url(https://source.unsplash.com/random/?quiz)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  });
  
  const Overlay = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(4),
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: '15px',
  }));
  
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
        <Background>
            <Container maxWidth="sm">
                <Overlay elevation={6}>
                    <Typography variant="h3" align="center" gutterBottom>
                        Welcome to Quizzus!
                    </Typography>
                    <Typography variant="h6" align="center" gutterBottom>
                        Enter your name to get started
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                variant="outlined"
                                label="Your Name"
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Button
                                fullWidth
                                variant="contained"
                                color="primary"
                                onClick={playGame}
                                size="large"
                            >
                                Play Now
                            </Button>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Button
                                fullWidth
                                variant="contained"
                                color="secondary"
                                onClick={createGame}
                                size="large"
                            >
                                Create Private Game
                            </Button>
                        </Grid>
                    </Grid>
                </Overlay>
            </Container>
        </Background>
    );
};

export default LobbyInvite;
