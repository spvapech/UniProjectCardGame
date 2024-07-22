import React, { useEffect, useState } from 'react';
import { Box, Button, Modal, TextField, Typography } from '@mui/material';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import axios from 'axios';

const SOCKET_URL = 'http://localhost:8080/ws';
const TOURNAMENT_API = 'http://localhost:8080/api/tournament';
const BET_STATUS_API = 'http://localhost:8080/api/bet/status';

const TournamentWaitingRoom = () => {
    const [playerCount, setPlayerCount] = useState(0);
    const userId = localStorage.getItem('userId');
    const [stompClient, setStompClient] = useState(null);
    const [showBetPopup, setShowBetPopup] = useState(false);
    const [betAmount, setBetAmount] = useState(0);
    const [betPlayer, setBetPlayer] = useState(''); // New state for the player to bet on
    const [tournamentId, setTournamentId] = useState();

    useEffect(() => {
        const fetchPlayerCount = async () => {
            try {
                const response = await axios.get(`${TOURNAMENT_API}/playerCount`);
                setPlayerCount(response.data);
            } catch (error) {
                console.error('Error fetching player count:', error);
            }
        };

        const fetchBetStatus = async () => {
            try {
                const response = await axios.get(`${BET_STATUS_API}`, { params: { userId } });
                if (response.data && response.data.length === 0) {
                    setShowBetPopup(true);
                }
            } catch (error) {
                console.error('Error fetching bet status:', error);
            }
        };

        fetchPlayerCount();
        fetchBetStatus();

        const sock = new SockJS(SOCKET_URL);
        const client = new Client({
            webSocketFactory: () => sock,
            debug: (str) => console.log(str),
            reconnectDelay: 5000,
            onConnect: () => {
                console.log('Connected');
                console.log('userId: ', userId)
                client.subscribe('/topic/tournament/players', (message) => {
                    const count = JSON.parse(message.body);
                    setPlayerCount(count);
                });
                client.subscribe(`/topic/tournament/start/bet/ready`, (message) => {
                    const payload = JSON.parse(message.body);
                    if (payload === true) {
                        // Navigate to the fight screen
                        window.location.href = '/topic/game';
                    }
                });
                client.subscribe(`/topic/tournament/winner/${userId}`, (message) => {
                    const payload = JSON.parse(message.body);
                    if (payload === true) {
                        // Display the alert when the user wins the tournament
                        alert("Sie haben das Turnier gewonnen und haben 700 SEP_COINS gewonnen!");
                        window.location.href = '/user/dashboard';
                    }
                });
                client.subscribe(`/topic/tournament/start/bet/${userId}`, (message) => {
                    const payload = JSON.parse(message.body);
                    handleBet(payload);
                });
                client.publish({
                    destination: '/app/tournament/join',
                    body: JSON.stringify({ userId })
                });

            },
            onStompError: (frame) => {
                console.error(frame);
            },
        });
        client.activate();
        setStompClient(client);

        const handleBeforeUnload = (event) => {
            client.publish({
                destination: '/app/tournament/leave',
                body: JSON.stringify(userId)
            });
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            client.deactivate();
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [userId]);

    const handleBet = (payload) => {
        console.log("Received Payload:", JSON.stringify(payload, null, 2));
        const variables = payload;
        var tournamentId = variables.tournamentId.toString();
        setTournamentId(tournamentId);
        console.log(tournamentId);
        setShowBetPopup(true);
    };

    const handlePlaceBet = () => {
        if (stompClient && stompClient.connected) {
            const bet = {
                userId: userId,
                bet: betAmount,
                tournamentId: tournamentId,
                winnerName: betPlayer // Include the bet player's name
            };
            stompClient.publish({
                destination: '/app/bet/place',
                body: JSON.stringify(bet)
            });
            setShowBetPopup(false);

        } else {
            console.error('Not connected to the WebSocket server.');
        }
    };

    const handleBetAmountChange = (e) => {
        const value = Number(e.target.value);
        if (value === 0 || value === 50) {
            setBetAmount(value);
        } else {
            alert("You can only bet 0 or 50 coins.");
        }
    };

    return (
        <>
            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100vh">
                <Typography variant="h4" gutterBottom>
                    Tournament Waiting Room
                </Typography>
                <Typography variant="h6" gutterBottom>
                    Players joined: {playerCount}
                </Typography>
            </Box>
            <Modal open={showBetPopup} onClose={() => setShowBetPopup(false)}>
                <Box sx={{ p: 4, backgroundColor: 'white', borderRadius: 1, boxShadow: 24, textAlign: 'center' }}>
                    <Typography variant="h6">Place Your Bet</Typography>
                    <TextField
                        label="Bet Amount"
                        type="number"
                        value={betAmount}
                        onChange={handleBetAmountChange}
                        sx={{ m: 1 }}
                    />
                    <TextField
                        label="Player to Bet On"
                        value={betPlayer}
                        onChange={(e) => setBetPlayer(e.target.value)}
                        sx={{ m: 1 }}
                    />
                    <Button variant="contained" color="primary" onClick={handlePlaceBet} sx={{ m: 1 }}>
                        Place Bet
                    </Button>
                </Box>
            </Modal>
        </>
    );
};

export default TournamentWaitingRoom;
