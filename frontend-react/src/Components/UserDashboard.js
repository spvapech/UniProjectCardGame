import React, {useEffect, useState} from "react";
import axios from "axios";
import {useNavigate, useParams} from "react-router-dom";
import SockJS from "sockjs-client";
import {Client} from "@stomp/stompjs";
import {Box, Button, Modal, Typography} from "@mui/material";

function UserDashboard() {
    const {friendId} = useParams();
    const [friends, setFriends] = useState([]);
    const [decks, setDecks] = useState([]);
    const [userData, setUserData] = useState(null);
    const [profilePicture, setProfilePicture] = useState(null);
    const navigate = useNavigate();
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [client, setClient] = useState(null);
    const [showPopup, setShowPopup] = useState(false);
    const [invitation, setInvitation] = useState(null);
    const [isOwnProfile, setIsOwnProfile] = useState(false);

    const SOCKET_URL = 'http://localhost:8080/ws';

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
            const userId = friendId || user.userId;
            setIsOwnProfile(!friendId || friendId === user.userId);

            if(userId){
                axios.get(`/api/user/details`, { withCredentials: true })
                    .then(response => {
                        setUserData(response.data);
                        setProfilePicture(response.data.profilPicture);
                    })
                    .catch(error => {
                        console.error('Error fetching user details:', error);
                    });
            }
            if(friendId){
                axios.get(`/details/friend/${friendId}`, { withCredentials: true })
                    .then(response => {
                        setUserData(response.data);
                        setProfilePicture(response.data.profilPicture);
                    })
                    .catch(error => {
                        console.error('Error fetching user details:', error);
                    });
            }

            handleGetUserDecks(userId);
            handleGetUserFriends(userId);
        } else {
            console.error('User cookie not found');
        }

        const userId = localStorage.getItem('userId');
        const sock = new SockJS(SOCKET_URL);
        const stompClient = new Client({
            webSocketFactory: () => sock,
            debug: (str) => console.log(str),
            reconnectDelay: 5000,
            onConnect: () => {
                console.log('Connected');
                stompClient.subscribe('/topic/status', (message) => {
                    const parsedMessage = JSON.parse(message.body);
                    updateOnlineStatus(parsedMessage);
                });
                stompClient.subscribe(`/topic/invite_someone/${userId}`, (message) => {
                    const invite = JSON.parse(message.body);
                    console.log('Invite received:', invite);
                    if (invite.enemyId === parseInt(userId)) {
                        showInvitationPopup(invite);
                    }
                });
                stompClient.subscribe(`/topic/tournament/betwinner/${userId}`, (message) => {
                    const payload = JSON.parse(message.body)
                    if (payload === true) {
                        window.location.href = '/shop';
                    }
                });
                stompClient.subscribe(`/topic/invite/response/${userId}`, (message) => {
                    const response = JSON.parse(message.body);
                    if (response.accepted) {
                        // Navigate to the fight screen
                        window.location.href = '/topic/game';
                    } else {
                        alert('Your fight invitation was declined.');
                    }
                });
                stompClient.publish({
                    destination: '/app/online-user',
                    body: JSON.stringify(userId)
                });
                getAllStatusFriends();// Abrufen der bereits online Benutzer
            },
            onStompError: (frame) => {
                console.error(frame);
            },
        });
        stompClient.activate();
        setClient(stompClient);

        const handleBeforeUnload = (event) => {
            stompClient.publish({
                destination: '/app/offline-user',
                body: JSON.stringify(userId)
            });
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            stompClient.deactivate();
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [friendId]);
    /*const initializeWebSocket = (username) => {
            WebSocketService.connect(
                () => {
                    console.log('Connected: ' + username);
                    WebSocketService.subscribe('/topic/online-users', updateOnlineStatus);
                },
                (frame) => {
                    console.error(frame);
                }
            );
        };*/

    function getAllStatusFriends() {
        // Implement this function if needed
    };

    const updateOnlineStatus = (message) => {
        setOnlineUsers((prevUsers) => {
            const updatedUsers = prevUsers.filter(user => user.id !== message.id);
            if (message.status === 'ONLINE') {
                updatedUsers.push(message);
            }
            return updatedUsers;
        });
    };

    const handleGetUserDecks = (userId) => {
        axios.get(`/deck/user/getAll`, { withCredentials: true })
            .then(response => {
                setDecks(response.data);
            })
            .catch(error => {
                console.error('Error fetching decks:', error);
            });
    };

    const handleGetUserFriends = (userId) => {
        axios.get(`/api/friends`, { withCredentials: true, params: { userId } })
            .then(response => {
                setFriends(response.data);
            })
            .catch(error => {
                console.error('Error fetching friends:', error);
            });
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

    const showInvitationPopup = (invite) => {
        setInvitation(invite);
        setShowPopup(true);
    };

    const handleDeckClick = (deckId) => {
        navigate(`/deck/edit/${deckId}`);
    };

    const handleAddFriendClick = () => {
        navigate('/add-friend');
    };

    const handleShopClick = () => {
        navigate('/shop');
    };

    const handleLeaderboardClick = () => {
        navigate('/Leaderboard');
    };

    const handleGameClick = () => {
        navigate('/topic/game');
    };

    const handleFriendClick = (friendId) => {
        navigate(`/friend/${friendId}`);
    };

    const handleClanListClick = () => {
        navigate(`/Clan`);
    };

    const handleMyClanListClick = () => {
        navigate(`/MyClan`);
    };

    const containerStyle = {
        display: 'flex',
        justifyContent: 'space-between',
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

    const mainContentStyle = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '60%',
    };

    const buttonStyle = {
        padding: '10px',
        backgroundColor: '#3A3B3C',
        color: '#fff',
        border: 'none',
        cursor: 'pointer',
        marginBottom: '20px',
        borderRadius: '5px'
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

    return (
        <div style={containerStyle}>
            <div style={sideBarStyle}>
                {isOwnProfile && (
                    <>
                    {userData && userData.clan && (
                        <button style={buttonStyle} onMouseOver={e => e.currentTarget.style.backgroundColor = '#3A3B3C'}
                                onMouseOut={e => e.currentTarget.style.backgroundColor = '#2C2D2E'}
                                onClick={handleMyClanListClick}>
                            My Clan
                        </button>
                    )}
                        <button style={buttonStyle} onMouseOver={e => e.currentTarget.style.backgroundColor = '#3A3B3C'}
                                onMouseOut={e => e.currentTarget.style.backgroundColor = '#2C2D2E'}
                                onClick={handleClanListClick}>
                            Clan List
                        </button>
                        <button style={buttonStyle} onMouseOver={e => e.currentTarget.style.backgroundColor = '#3A3B3C'}
                                onMouseOut={e => e.currentTarget.style.backgroundColor = '#2C2D2E'}
                                onClick={handleLeaderboardClick}>
                            Leaderboard
                        </button>
                        <button style={buttonStyle} onMouseOver={e => e.currentTarget.style.backgroundColor = '#3A3B3C'}
                                onMouseOut={e => e.currentTarget.style.backgroundColor = '#2C2D2E'}
                                onClick={() => window.location.href = '/create-deck'}>
                            Create Deck
                        </button>


                        <h4>My Decks</h4>
                        <ul style={listStyle}>
                            {decks.map(deck => (
                                <li key={deck.id} style={listItemStyle} onClick={() => handleDeckClick(deck.id)}>
                                    {deck.name}
                                </li>
                            ))}
                        </ul>
                    </>
                )}
            </div>
            <div style={mainContentStyle}>
                <h1>{isOwnProfile ? "User Dashboard" : "Profile"}</h1>
                {userData && (
                    <div>
                        <h2>Welcome, {userData.firstName} {userData.lastName}!</h2>
                        <p>Username: {userData.username}</p>
                        <p>Email: {userData.email}</p>
                        <p>SEP Coins: {userData.SEP_Coins}</p>
                        <p>Rank: {userData.rank}</p>
                        <p>Date: {userData.date}</p>
                        <p>Clan: {userData.clan}</p>
                        {profilePicture && (
                            <img src={`data:image/jpeg;base64,${profilePicture}`} alt="Profile"
                                 style={{width: '150px', height: '150px', borderRadius: '50%'}}/>
                        )}
                        {isOwnProfile && (
                            <button style={{...buttonStyle, marginTop: '20px'}}
                                    onClick={handleGameClick}>CardGame</button>
                        )}
                    </div>
                )}
            </div>
            <div style={sideBarStyle}>
                {isOwnProfile && (
                    <>
                        <button style={buttonStyle} onMouseOver={e => e.currentTarget.style.backgroundColor = '#3A3B3C'}
                                onMouseOut={e => e.currentTarget.style.backgroundColor = '#2C2D2E'}
                                onClick={handleShopClick}>
                            Go to Shop
                        </button>
                        <button style={buttonStyle} onMouseOver={e => e.currentTarget.style.backgroundColor = '#3A3B3C'}
                                onMouseOut={e => e.currentTarget.style.backgroundColor = '#2C2D2E'}
                                onClick={handleAddFriendClick}>
                            Add Friend
                        </button>
                    </>
                )}
                <h4>Friends</h4>
                <ul style={listStyle}>
                    {friends.map(friend => (
                        <li key={friend.id} style={listItemStyle} onClick={() => handleFriendClick(friend.id)}>
                            {friend.firstName} {friend.lastName}
                        </li>
                    ))}
                </ul>
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

export default UserDashboard;
