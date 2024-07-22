import React, { useEffect, useState } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

const SOCKET_URL = 'http://localhost:8080/ws';

const Tournament = () => {
    const [gameState, setGameState] = useState(null);
    const [client, setClient] = useState(null);

    useEffect(() => {
        const userId = localStorage.getItem('userId');
        const sock = new SockJS(SOCKET_URL);
        const stompClient = new Client({
            webSocketFactory: () => sock,
            debug: (str) => console.log(str),
            reconnectDelay: 5000,
            onConnect: () => {
                console.log('Connected');
                stompClient.subscribe('/topic/tournament/game', (message) => {
                    const gameUpdate = JSON.parse(message.body);
                    setGameState(gameUpdate);
                });

                // Notify server that this client has started the tournament
                stompClient.publish({
                    destination: '/app/tournament/start',
                    body: JSON.stringify({ userId })
                });
            },
            onStompError: (frame) => {
                console.error('STOMP Error:', frame);
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
    }, []);

    return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
            <h1>Tournament</h1>
            {gameState ? (
                <div>
                    <h2>Game State</h2>
                    <pre>{JSON.stringify(gameState, null, 2)}</pre>
                </div>
            ) : (
                <div>Loading game state...</div>
            )}
        </div>
    );
};

export default Tournament;
