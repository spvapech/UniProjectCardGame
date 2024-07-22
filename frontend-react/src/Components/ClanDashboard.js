import React, { useEffect, useState } from 'react';
import { Box, TextField, Button, Modal, Typography } from '@mui/material';
import axios from 'axios';

const ClanDashboard = () => {
    const [clans, setClans] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [newClanName, setNewClanName] = useState('');
    const [openModal, setOpenModal] = useState(false);
    const [userClan, setUserClan] = useState(null);

    useEffect(() => {
        const fetchClans = async () => {
            try {
                const response = await axios.get('http://localhost:8080/api/Clan');
                setClans(response.data);
            } catch (error) {
                console.error('Error fetching clans:', error);
            }
        };
        const fetchUserClans = async () => {
            try {
                const response = await axios.get('http://localhost:8080/api/Clan/userClan', { withCredentials: true });
                if (response.data && typeof response.data === 'object') {
                    setUserClan(response.data);
                } else {
                    console.error('Expected an object for user clan:', response.data);
                }
            } catch (error) {
                console.error('Error fetching user clan:', error);
            }
        };

        fetchClans();
        fetchUserClans();
    }, []);

    const handleSearch = (event) => {
        setSearchTerm(event.target.value);
    };

    const handleOpenModal = () => {
        setOpenModal(true);
    };

    const handleCloseModal = () => {
        setOpenModal(false);
    };

    const handleCreateClan = async () => {
        try {
            const response = await axios.post('http://localhost:8080/api/Clan/Create', { clanName: newClanName }, { withCredentials: true });
            if (response.status === 201) {
                setClans([...clans, response.data]);
                setNewClanName('');
                handleCloseModal();
                alert('Clan erfolgreich erstellt!');
            }
        } catch (error) {
            console.error('Error creating clan:', error);
        }
    };

    const handleJoinClan = async (clanId) => {
        try {
            console.log(`Joining clan with ID: ${clanId}`);
            const response = await axios.post(`http://localhost:8080/api/Clan/Join/${clanId}`, {}, { withCredentials: true });
            console.log('Join response:', response);
            if (response.status === 201) {
                alert('You joined a clan');
            } else {
                console.error('Unexpected response status:', response.status);
            }
        } catch (error) {
            console.error('Error joining clan:', error);
        }
    };

    const handleLeaveClan = async (clanId) => {
        try {
            console.log(`Attempting to leave clan with ID: ${clanId}`);
            const response = await axios.post(`http://localhost:8080/api/Clan/leave/${clanId}`, {}, { withCredentials: true });
            console.log('Leave response:', response);
            if (response.status === 201) {
                setUserClan(null);
                alert('You left the clan');
            } else {
                console.error('Unexpected response status:', response.status);
            }
        } catch (error) {
            console.error('Error leaving clan:', error);
        }
    };

    const filteredClans = clans.filter(clan =>
        clan.name && clan.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // CSS styles
    const containerStyle = {
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        backgroundColor: '#f0f0f0',
    };

    const inputStyle = {
        marginBottom: '20px',
        width: '300px',
    };

    const modalStyle = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 400,
        bgcolor: 'background.paper',
        border: '2px solid #000',
        boxShadow: 24,
        p: 4,
    };
    const tableStyle = {
        width: '80%',
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
        padding: '20px',
    };

    const thStyle = {
        borderBottom: '1px solid #ddd',
        padding: '10px',
        textAlign: 'left',
    };

    const tdStyle = {
        padding: '10px',
        textAlign: 'left',
    };

    return (
        <div style={containerStyle}>
            <h1>Clan List</h1>
            <TextField
                label="Search Clan"
                variant="outlined"
                value={searchTerm}
                onChange={handleSearch}
                style={inputStyle}
            />
            <table style={tableStyle}>
                <thead>
                <tr>
                    <th style={thStyle}>ID</th>
                    <th style={thStyle}>Name</th>
                </tr>
                </thead>
                <tbody>
                {filteredClans.map(clan => (
                    <tr key={clan.id}>
                        <td style={tdStyle}>{clan.id}</td>
                        <td style={tdStyle}>{clan.name}</td>
                        <td style={tdStyle}>
                            {userClan && userClan.id === clan.id ? (
                                <Button
                                    variant="contained"
                                    color="secondary"
                                    onClick={() => handleLeaveClan(clan.id)}
                                >
                                    Leave
                                </Button>
                            ) : (
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={() => handleJoinClan(clan.id)}
                                >
                                    Join
                                </Button>
                            )}
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
            <Button variant="contained" color="primary" onClick={handleOpenModal}>
                Create Clan
            </Button>
            <Modal open={openModal} onClose={handleCloseModal}>
                <Box sx={{...modalStyle}}>
                    <Typography variant="h6" component="h2">
                        Create New Clan
                    </Typography>
                    <TextField
                        label="Clan Name"
                        variant="outlined"
                        value={newClanName}
                        onChange={(e) => setNewClanName(e.target.value)}
                        style={inputStyle}
                    />
                    <Button variant="contained" color="primary" onClick={handleCreateClan}>
                        Create
                    </Button>
                </Box>
            </Modal>
        </div>
    );
};

export default ClanDashboard;
