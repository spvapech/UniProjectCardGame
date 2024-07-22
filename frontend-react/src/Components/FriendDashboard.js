import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function FriendDashboard() {
    const [friends, setFriends] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [usernameToAdd, setUsernameToAdd] = useState('');
    const [userData, setUserData] = useState(null);
    const [profilePicture, setProfilePicture] = useState(null);
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
                    setProfilePicture(response.data.profilPicture);
                    handleGetUserFriends(userId);
                    handleGetPendingRequests(userId);
                })
                .catch(error => {
                    console.error('Error fetching user details:', error);
                });
        } else {
            console.error('User cookie not found');
        }
    }, []);

    const handleGetUserFriends = (userId) => {
        axios.get(`/api/friends`, { withCredentials: true, params: { userId } })
            .then(response => {
                setFriends(response.data);
            })
            .catch(error => {
                console.error('Error fetching friends:', error);
            });
    };

    const handleGetPendingRequests = (userId) => {
        axios.get(`/api/friends/pendingRequests`, { withCredentials: true, params: { userId } })
            .then(response => {
                setPendingRequests(response.data);
            })
            .catch(error => {
                console.error('Error fetching pending requests:', error);
            });
    };

    const handleAcceptRequest = (requestId) => {
        axios.post(`/api/friends/respondRequest`, null, { params: { requestId, status: 'ACCEPTED' }, withCredentials: true })
            .then(() => {
                handleGetUserFriends(userData.id);
                handleGetPendingRequests(userData.id);
            })
            .catch(error => {
                console.error('Error accepting request:', error);
            });
    };

    const handleDeclineRequest = (requestId) => {
        axios.post(`/api/friends/respondRequest`, null, { params: { requestId, status: 'DECLINED' }, withCredentials: true })
            .then(() => {
                handleGetPendingRequests(userData.id);
            })
            .catch(error => {
                console.error('Error declining request:', error);
            });
    };

    const handleAddFriend = () => {
        axios.post(`/api/friends/sendRequest`, null, { params: { requesterId: userData.id, recipientUsername: usernameToAdd }, withCredentials: true })
            .then(response => {
                console.log('Friend request sent:', response.data);
                setUsernameToAdd('');
                handleGetPendingRequests(userData.id); // Update pending requests
            })
            .catch(error => {
                console.error('Error sending friend request:', error);
            });
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

    const mainContentStyle = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
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
            <div style={mainContentStyle}>
                <h1>Friend Requests</h1>
                <ul style={listStyle}>
                    {pendingRequests.map(request => (
                        <li key={request.id} style={listItemStyle}>
                            <p>{request.requester.firstName} {request.requester.lastName}</p>
                            <button style={buttonStyle} onClick={() => handleAcceptRequest(request.id)}>Accept</button>
                            <button style={buttonStyle} onClick={() => handleDeclineRequest(request.id)}>Decline</button>
                        </li>
                    ))}
                </ul>
                <h2>Add Friend</h2>
                <input
                    type="text"
                    value={usernameToAdd}
                    onChange={e => setUsernameToAdd(e.target.value)}
                    placeholder="Enter username"
                />
                <button style={buttonStyle} onClick={handleAddFriend}>Add Friend</button>
            </div>
        </div>
    );
}

export default FriendDashboard;