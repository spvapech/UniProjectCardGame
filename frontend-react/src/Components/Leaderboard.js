import React, { useEffect, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Modal, Box, Button, Typography, TextField } from '@mui/material';

const SOCKET_URL = 'http://localhost:8080/ws';

const Leaderboard = () => {
    const [users, setUsers] = useState([]);
    const [client, setClient] = useState(null);
    const [showPopup, setShowPopup] = useState(false);
    const [invitation, setInvitation] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');


    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await fetch('http://localhost:8080/api/getAll');
                const data = await response.json();
                setUsers(data);
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        };

        const userId = localStorage.getItem('userId');
        const sock = new SockJS(SOCKET_URL);
        const stompClient = new Client({
            webSocketFactory: () => sock,
            debug: (str) => console.log(str),
            reconnectDelay: 5000,
            onConnect: () => {
                console.log('Connected');
                stompClient.subscribe('/topic/status', (message) => {
                    const updatedUser = JSON.parse(message.body);
                    setUsers((prevUsers) =>
                        prevUsers.map((user) =>
                            user.id === updatedUser.id ? updatedUser : user
                        )
                    );
                });
                stompClient.subscribe(`/topic/invite_someone/${userId}`, (message) => {
                    const invite = JSON.parse(message.body);
                    console.log('Invite received:', invite);
                    if (invite.enemyId === parseInt(userId)) {
                        showInvitationPopup(invite);
                    }
                });
                stompClient.subscribe(`/topic/invite/response/${userId}`, (message) => {
                    const response = JSON.parse(message.body);
                    if (response.accepted) {
                        if (response.enemyId === 1 || response.userId === 1) {
                            window.location.href = '/topic/game/bot'
                        } else {
                            window.location.href = '/topic/game'
                        }
                    } else {
                        alert('Your fight invitation was declined.');
                    }
                });
                stompClient.publish({
                    destination: '/app/online-user',
                    body: JSON.stringify(userId)
                });
                fetchUsers();
            },
            onStompError: (frame) => {
                console.error(frame);
            },
        });

        stompClient.activate();
        setClient(stompClient);

        return () => {
            stompClient.deactivate();
        };
    }, []);

    const showInvitationPopup = (invite) => {
        setInvitation(invite);
        setShowPopup(true);
    };

    const sendFightInvitation = (enemyId) => {
        const userId = localStorage.getItem('userId');
        if (client && client.connected) {
            client.publish({
                destination: '/app/invite',
                body: JSON.stringify({ userId, enemyId })
            });
        }
    };

    const handleAccept = () => {
        if (client && client.connected) {
            client.publish({
                destination: '/app/accept-invite',
                body: JSON.stringify({
                    userId: invitation.enemyId,
                    enemyId: invitation.userId,
                    accepted: true
                })
            });
        }
        setShowPopup(false);
    };

    const handleDecline = () => {
        if (client && client.connected) {
            client.publish({
                destination: '/app/decline-invite',
                body: JSON.stringify({
                    userId: invitation.enemyId,
                    enemyId: invitation.userId,
                    accepted: false
                })
            });
        }
        setShowPopup(false);
    };

    const handleSearch = (event) => {
        setSearchTerm(event.target.value);
    };

    const filteredUsers = users
        .filter(user => user.username.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => b.rank - a.rank);

    // CSS styles
    const containerStyle = {
        backgroundImage: 'url("http://localhost:8080/uploads/background2.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        margin: 'auto',
        color: 'white'
    };

    const inputStyle = {
        padding: '8px',
        fontSize: '14px',
        width: 'calc(100% - 16px)',
        maxWidth: '300px',
        backgroundColor: '#333333',
        borderRadius: '8px',
        border: '1px solid #555',
        marginBottom: '10px',
        color: 'white',
        textAlign: 'center'
    };

    const buttonStyle = {
        padding: '8px 16px',
        fontSize: '14px',
        width: '100%',
        maxWidth: '200px',
        backgroundColor: '#3A3B3C',
        color: 'white',
        border: 'none',
        cursor: 'pointer',
        marginBottom: '10px',
        borderRadius: '8px'
    };

    const hoverColor = '#2C2D2E';

    const tableStyle = {
        width: '100%',
        maxWidth: '800px',
        backgroundColor: '#444',
        borderRadius: '8px',
        padding: '20px',
        color: 'white',
        borderCollapse: 'collapse',
    };

    const thStyle = {
        borderBottom: '1px solid white',
        padding: '10px',
    };

    const tdStyle = {
        padding: '10px',
        textAlign: 'center',
    };

    return (
        <div className="leaderboard-container" style={containerStyle}>
            <h1 style={{ textAlign: 'center' }}>Leaderboard</h1>
            <TextField
                label="Search User"
                variant="outlined"
                value={searchTerm}
                onChange={handleSearch}
                sx={{ mb: 2 }}
                style={inputStyle}
            />
            <table className="leaderboard-table" style={tableStyle}>
                <thead>
                <tr>
                    <th style={thStyle}>Top</th>
                    <th style={thStyle}>Username</th>
                    <th style={thStyle}>Rank</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Action</th>
                </tr>
                </thead>
                <tbody>
                {filteredUsers.map((user, index) => (
                    <tr key={user.id}>
                        <td style={tdStyle}>{index + 1}</td>
                        <td style={tdStyle}>{user.username}</td>
                        <td style={tdStyle}>{user.rank}</td>
                        <td style={tdStyle}>{user.status}</td>
                        <td style={tdStyle}>
                            {user.status === 'ONLINE' && (
                                <button className="fight-button" style={buttonStyle} onMouseOver={e => e.currentTarget.style.backgroundColor = hoverColor} onMouseOut={e => e.currentTarget.style.backgroundColor = '#3A3B3C'} onClick={() => sendFightInvitation(user.id)}>
                                    FIGHT
                                </button>
                            )}
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
            <Modal open={showPopup} onClose={() => setShowPopup(false)}>
                <Box sx={{ p: 4, backgroundColor: 'white', borderRadius: 1, boxShadow: 24, textAlign: 'center' }}>
                    <Typography variant="h6">Game Invitation</Typography>
                    <Typography variant="body1">You have been invited to a game by {invitation?.userId}</Typography>
                    <Button variant="contained" color="primary" onClick={handleAccept} sx={{ m: 1 }}>Accept</Button>
                    <Button variant="contained" color="secondary" onClick={handleDecline} sx={{ m: 1 }}>Decline</Button>
                </Box>
            </Modal>
        </div>
    );
};

export default Leaderboard;
