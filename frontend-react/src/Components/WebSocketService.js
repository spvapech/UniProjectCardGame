import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const SOCKET_URL = 'http://localhost:8080/ws';

class WebSocketService {
    constructor() {
        this.client = null;
    }

    connect(onConnectCallback, onErrorCallback, userId) {
        const sock = new SockJS(SOCKET_URL);
        this.client = new Client({
            webSocketFactory: () => sock,
            debug: (str) => console.log(str),
            reconnectDelay: 5000,
            onConnect: () => {
                onConnectCallback();
                this.client.publish({
                    destination: '/app/online-user',
                    body: JSON.stringify(userId)
                });
            },
            onStompError: onErrorCallback,
        });

        this.client.activate();

        window.onbeforeunload = () => {
            this.publish('/app/offline-user', { userId });
            this.client.deactivate();
        };
    }

    subscribe(topic, callback) {
        if (this.client && this.client.connected) {
            this.client.subscribe(topic, (message) => {
                const parsedMessage = JSON.parse(message.body);
                callback(parsedMessage);
            });
        } else {
            console.error('WebSocket client is not connected');
        }
    }

    publish(destination, payload) {
        if (this.client && this.client.connected) {
            this.client.publish({
                destination: destination,
                body: JSON.stringify(payload),
            });
        } else {
            console.error('WebSocket client is not connected');
        }
    }

    disconnect() {
        if (this.client) {
            this.client.deactivate();
        }
    }
}

export default new WebSocketService();
