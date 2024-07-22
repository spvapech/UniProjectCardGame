import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function AdminDashboard() {
    const [friends, setFriends] = useState([]);
    const [decks, setDecks] = useState([]);
    const [userData, setUserData] = useState(null);
    const navigate = useNavigate();

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

            axios.get(`/api/user/details`, { withCredentials: true })
                .then(response => {
                    setUserData(response.data);
                })
                .catch(error => {
                    console.error('Error fetching user details:', error);
                });

            handleGetUserDecks(userId);
            handleGetUserFriends(userId);
        } else {
            console.error('User cookie not found');
        }
    }, []);

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
                console.log('Friends data:', response.data);  // Debugging: Log the friends data
                setFriends(response.data);
            })
            .catch(error => {
                console.error('Error fetching friends:', error);
            });
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

    const containerStyle = {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '20px',
        backgroundImage: 'url("http://localhost:8080/uploads/background4.png")',
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
            </div>
            <div style={mainContentStyle}>
                <h1>Admin Dashboard</h1>
                {userData && (
                    <div>
                        <h2>Welcome, {userData.firstName} {userData.lastName}!</h2>
                        <p>Username: {userData.username}</p>
                        <p>Email: {userData.email}</p>
                        <p>SEP Coins: {userData.SEP_Coins}</p>
                        <p>Rank: {userData.rank}</p>
                        <p>Date: {userData.date}</p>
                    </div>
                )}
            </div>
            <div style={sideBarStyle}>
                <button style={buttonStyle} onMouseOver={e => e.currentTarget.style.backgroundColor = '#3A3B3C'}
                        onMouseOut={e => e.currentTarget.style.backgroundColor = '#2C2D2E'}
                        onClick={() => window.location.href = '/csv'}>
                    Admin Panel
                </button>
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
                <h4>Friends</h4>
                <ul style={listStyle}>
                    {friends.map(friend => (
                        <li key={friend.id} style={listItemStyle}>
                            {friend.firstName} {friend.lastName}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

export default AdminDashboard;
