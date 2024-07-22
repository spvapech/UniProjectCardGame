// MyClanDashboard.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import {Box, Button, Modal, Typography} from "@mui/material";

const SOCKET_URL = 'http://localhost:8080/ws';

function MyClanDashboard() {
    const [members, setMembers] = useState([]);
    const [clanName, setClanName] = useState("");
    const [isInClan, setIsInClan] = useState(false);
    const [tournamentWaiting, setTournamentWaiting] = useState(false);
    const [stompClient, setStompClient] = useState(null);
    const navigate = useNavigate();
    const userId = localStorage.getItem('userId');
    const [showPopup, setShowPopup] = useState(false);
    const [invitation, setInvitation] = useState(null);

    function getCookieValue(name) {
        const regex = new RegExp(`(^| )${name}=([^;]+)`);
        const match = document.cookie.match(regex);
        if (match) {
            return decodeURIComponent(match[2]);
        }
        return null;
    }

    useEffect(() => {
        const userCookie = getCookieValue('user');

        if (userCookie) {
            const user = JSON.parse(userCookie);
            const userId = user.userId;

            axios.get(`/api/Clan/members`, { withCredentials: true, params: { userId } })
                .then(response => {
                    setMembers(response.data);
                    setIsInClan(response.data.length > 0);
                })
                .catch(error => {
                    console.error('Error fetching Members:', error);
                });

            axios.get(`/api/Clan/name`, { withCredentials: true, params: { userId } })
                .then(response => {
                    setClanName(response.data);
                })
                .catch(error => {
                    console.error('Error fetching Clanname:', error);
                });
        }

        const sock = new SockJS(SOCKET_URL);
        const client = new Client({
            webSocketFactory: () => sock,
            debug: (str) => console.log(str),
            reconnectDelay: 5000,
            onConnect: () => {
                console.log('Connected');
                client.subscribe(`/topic/invite/clan/${userId}`, (message) => {
                    const invite = JSON.parse(message.body);
                    showInvitationPopup(invite);
                });
            },
            onStompError: (frame) => {
                console.error(frame);
            },
        });
        client.activate();
        setStompClient(client);

        return () => {
            client.deactivate();
        };
    }, [userId]);

    const handleMemberClick = (friendId) => {
        navigate(`/friend/${friendId}`);
    };

    const handleJoinTournament = () => {
        setTournamentWaiting(true);
        if (stompClient && stompClient.connected) {
            stompClient.publish({
                destination: '/app/clan/invite',
                body: JSON.stringify({ userId })
            });
        } else {
            console.error('Not connected to the WebSocket server.');
        }
    };

    const showInvitationPopup = (invite) => {
        setInvitation(invite);
        setShowPopup(true);
    };

    const handleAccept = () => {
        if (stompClient && stompClient.connected) {
            stompClient.publish({
                destination: '/app/clan/accept',
                body: JSON.stringify({
                    userId: userId,
                    accepted: true
                })
            });
        }
        setShowPopup(false);
        navigate('/tournament/waiting');
    };

    const handleDecline = () => {
        if (stompClient && stompClient.connected) {
            stompClient.publish({
                destination: '/app/clan/decline',
                body: JSON.stringify({
                    userId: userId,
                    accepted: false
                })
            });
        }
        setShowPopup(false);
    };


    const containerStyle = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        backgroundImage: 'url("http://localhost:8080/uploads/background2.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        height: '100vh',
        color: '#fff'
    };

    const sideBarStyle = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '20%',
    };

    const listStyle = {
        listStyleType: 'none',
        padding: '0',
        margin: '0',
        width: '100%'
    };

    const listItemStyle = {
        padding: '8px',
        margin: '2px 0',
        textAlign: 'center',
        cursor: 'pointer',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        color: '#fff',
        borderRadius: '5px'
    };

    const buttonContainerStyle = {
        display: 'flex',
        justifyContent: 'center',
        marginTop: '20px',
    };

    const buttonStyle = {
        padding: '10px 20px',
        backgroundColor: '#007bff',
        color: '#fff',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        textAlign: 'center'
    };

    const disabledButtonStyle = {
        ...buttonStyle,
        backgroundColor: '#6c757d',
        cursor: 'not-allowed'
    };

    return (
        <div style={containerStyle}>
            <div style={sideBarStyle}>
                <h3>{clanName}</h3>
                <h4>Members</h4>
                <ul style={listStyle}>
                    {members.map(member => (
                        <li key={member.id} style={listItemStyle} onClick={() => handleMemberClick(member.id)}>
                            {member.firstName} {member.lastName}
                        </li>
                    ))}
                </ul>
                {isInClan && (
                    <div style={buttonContainerStyle}>
                        <button
                            style={tournamentWaiting ? disabledButtonStyle : buttonStyle}
                            onClick={handleJoinTournament}
                            disabled={tournamentWaiting}
                        >
                            {tournamentWaiting ? 'Waiting for Tournament to Start...' : 'Join Tournament'}
                        </button>
                    </div>
                )}
            </div>
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
}

export default MyClanDashboard;
