import React, {useEffect, useRef, useState} from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import axios from 'axios';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useNavigate } from 'react-router-dom';
import './GameComponent.css';

const SOCKET_URL = 'http://localhost:8080/ws';

const ItemTypes = {
    CARD: 'card'
};

const Card = ({ card, index, moveCard, onSelect, isSelected }) => {
    const [{ isDragging }, drag] = useDrag({
        type: ItemTypes.CARD,
        item: { card, index },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    });

    return (
        <div
            ref={drag}
            className={`card ${isSelected ? 'selected' : ''}`}
            style={{ opacity: isDragging ? 0.5 : 1 }}
            onClick={() => onSelect(card, index)}
        >
            <div className="card-stats">
                <p>ATK: {card.cardAtkPoints}</p>
                <p>DEF: {card.cardDefPoints}</p>
                <p>RARITY: {card.cardRarity}</p>
            </div>
            <img src={card.cardPictureUrl} alt={card.cardName} className="card-image" />
        </div>
    );
};

const CardSlot = ({ card, index, moveCard, allowDrop, onSelect, isSelected }) => {
    const [, drop] = useDrop({
        accept: ItemTypes.CARD,
        canDrop: () => allowDrop,
        drop: (item) => moveCard(item.index, index),
    });

    return (
        <div ref={drop} className="card-slot" onClick={() => card && onSelect(card, index)}>
            {card ? (
                <Card
                    card={card}
                    index={index}
                    moveCard={moveCard}
                    onSelect={onSelect}
                    isSelected={isSelected}
                />
            ) : (
                'Empty'
            )}
        </div>
    );
};

const GameComponent = () => {
    const [client, setClient] = useState(null);
    const [decks, setDecks] = useState([]);
    const [selectedDeckCards, setSelectedDeckCards] = useState([]);
    const [hand, setHand] = useState([]);
    const [enemyField, setEnemyField] = useState(Array(5).fill(null));
    const [userField, setUserField] = useState(Array(5).fill(null));
    const [currentTurnUserId, setCurrentTurnUserId] = useState(null);
    const [duellId, setDuellId] = useState(null);
    const [decksSelected, setDecksSelected] = useState(0);
    const [enemyId, setEnemyId] = useState();
    const userId = localStorage.getItem('userId');
    const [isDeckSelected, setIsDeckSelected] = useState(false);
    const [gameStarted, setGameStarted] = useState(false);
    const [userHp, setUserHp] = useState();
    const [enemyHp, setEnemyHp] = useState();
    const [selectedUserFieldCard, setSelectedUserFieldCard] = useState(null);
    const [selectedHandCard, setSelectedHandCard] = useState(null);
    const [selectedEnemyCard, setSelectedEnemyCard] = useState(null);
    const [endGameStats, setEndGameStats] = useState(null);
    const [consoleMessages, setConsoleMessages] = useState([]);
    const [userStats, setUserStats] = useState({
        totalDamage: 99,
        cardsPlayed: {common: 3, rare: 0, legendary: 1},
        cardsSacrificed: {common: 3, rare: 0, legendary: 0},
    });
    const [tournamentInfo, setTournamentInfo] = useState({
        tournamentId: null,
        participants: [],
        winnersQueue: []
    });

    const [enemyStats, setEnemyStats] = useState({
        totalDamage: 0,
        cardsPlayed: {common: 0, rare: 0, legendary: 0},
        cardsSacrificed: {common: 0, rare: 0, legendary: 0},
    });
    const [timeLeft, setTimeLeft] = useState(20); // Timer für 60 Sekunden
    const timerRef = useRef(null);
    const navigate = useNavigate();


    useEffect(() => {
        fetchUserDecks();

        const sock = new SockJS(SOCKET_URL);
        const stompClient = new Client({
            webSocketFactory: () => sock,
            debug: (str) => console.log(str),
            reconnectDelay: 5000,
            onConnect: () => {
                console.log('Connected');
                stompClient.subscribe(`/topic/duel/start/${userId}`, (message) => {
                    const gameUpdate = JSON.parse(message.body.toString());
                    handleGameStart(gameUpdate);
                });
                stompClient.subscribe(`/topic/duel/endGame/${userId}`, (message) => {
                    const endGamePayload = JSON.parse(message.body.toString());
                    handleGameEnded(endGamePayload);
                });
                stompClient.subscribe(`/topic/tournament/information/${userId}`, (message) => {
                    const payload = JSON.parse(message.body.toString());
                    console.log("Received message TournamentInfo:", payload);
                    handleTournamentInfo(JSON.parse(message.body.toString()));
                });
                stompClient.publish({
                    destination: '/app/tournament/info',
                    body: userId
                });
                stompClient.publish({
                    destination: '/app/online-user',
                    body: JSON.stringify(userId)
                });
                stompClient.publish({
                    destination: '/app/start-duel',
                    body: userId
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
        window.addEventListener('gameEnded', handleGameEnded);


        // Automatische Deckauswahl für Benutzer mit ID 1
        const preselectDeck = async () => {
            if (userId === 1) {
                try {
                    console.log("Selecting deck for user ID 1");
                    const response = await axios.get(`/deck/getByName`, {
                        params: { name: "Bot's Deck" },
                        withCredentials: true
                    });
                    const deck = response.data;
                    setSelectedDeckCards(deck.cards);
                    setHand(getRandomCards(deck.cards, 5));
                    setIsDeckSelected(true);
                    console.log("Deck with name 'Bot's Deck' selected for user ID 1");
                    client.publish({
                        destination: '/app/deck-selected',
                        body: userId
                    });
                } catch (error) {
                    console.error('Error fetching deck:', error);
                }
            }
        };

        preselectDeck();

        return () => {
            stompClient.deactivate();
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [userId]);

    useEffect(() => {
        if (currentTurnUserId === userId) {
            startTimer();
        } else {
            clearTimer();
        }
        return () => clearTimer();
    }, [currentTurnUserId]);


    const fetchUserDecks = async () => {
        try {
            const response = await axios.get(`/deck/user/getAll`, {withCredentials: true});
            setDecks(response.data);
        } catch (error) {
            console.error('Error fetching decks:', error);
        }
    };

    const getRandomCards = (cards, count) => {
        const shuffled = cards.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    };

    const endTurn = () => {
        if (client && client.connected) {
            setConsoleMessages([]);  // Clear console messages when ending turn

            const payload = {
                duellId: duellId,
                userId: userId,
                enemyId: enemyId,
                userField: userField,
                enemyField: enemyField,
                userHp: userHp,
                enemyHp: enemyHp,
                nextTurnUserId: enemyId
            };

            console.log('Ending turn with payload:', payload);

            client.publish({
                destination: '/app/end-turn',
                body: JSON.stringify(payload)
            });
        } else {
            console.error('Cannot end turn. Client is not connected.');
        }
    };

    const selectDeck = async (deck) => {
        try {
            const response = await axios.get(`/deck/get/${deck.id}`, {withCredentials: true});
            setSelectedDeckCards(response.data);
            setHand(getRandomCards(response.data, 5));
            setIsDeckSelected(true);

            client.publish({
                destination: '/app/deck-selected',
                body: userId
            });
        } catch (error) {
            console.error('Error fetching deck cards:', error);
        }
    };

    const handleGameStart = (gameUpdate) => {
        console.log("Game Update:", gameUpdate);

        setGameStarted(true);
        const duellData = gameUpdate;

        const userField = Array(5).fill(null);
        const enemyField = Array(5).fill(null);

        duellData.userField.forEach((card, index) => {
            if (index < userField.length) {
                userField[index] = card;
            }
        });

        duellData.enemyField.forEach((card, index) => {
            if (index < enemyField.length) {
                enemyField[index] = card;
            }
        });

        const userId = localStorage.getItem('userId');
        let enemyId;
        let currentTurnUserId = duellData.currentTurnUserId.toString();

        if (userId == duellData.userId.toString()) {
            setUserField(userField);
            setEnemyField(enemyField);
            enemyId = duellData.enemyId.toString();
        } else if (userId == duellData.enemyId.toString()) {
            setUserField(enemyField);
            setEnemyField(userField);
            enemyId = duellData.userId.toString();
        } else {
            console.error('User ID does not match any players in this duel.');
        }

        setEnemyId(enemyId);
        setCurrentTurnUserId(currentTurnUserId);
        setDuellId(duellData.duellId);
        setUserHp(userId == duellData.userId.toString() ? duellData.userHp : duellData.enemyHp);
        setEnemyHp(userId == duellData.userId.toString() ? duellData.enemyHp : duellData.userHp);

        console.log("userField Update:", userField);
        console.log("enemyField Update:", enemyField);
        console.log("userId Update:", userId);
        console.log("enemyId Update:", enemyId);
        console.log("currentUserTurn: ", currentTurnUserId);
    };

    const moveCard = (fromIndex, toIndex) => {
        const updatedHand = [...hand];
        const updatedUserField = [...userField];
        const cardToMove = updatedHand[fromIndex];

        if (cardToMove.cardRarity === 'RARE' || cardToMove.cardRarity === 'LEGENDARY') {
            alert('Rare or Legendary cards cannot be played directly. Use the sacrifice mechanism.');
            return;
        }

        updatedUserField[toIndex] = cardToMove;
        updatedHand[fromIndex] = null;
        setHand(updatedHand.filter(card => card !== null));
        setUserField(updatedUserField);

        // Update stats for card play
        updateStatsForCardPlay(cardToMove, true);
    };

    const directAttack = () => {
        if (!selectedUserFieldCard) {
            alert('You must select a card to attack with!');
            return;
        }

        const {card: userCard} = selectedUserFieldCard;

        if (enemyField.every(card => card === null)) {
            setEnemyHp(prev => {
                const newHp = prev - userCard.cardAtkPoints;
                if (newHp <= 0) {
                    endGame(enemyId);
                }
                return newHp;
            });

            setSelectedUserFieldCard(null);
        } else {
            alert('There are enemy cards on the field. You must attack them first.');
        }
    };

    const battle = () => {
        if (enemyField.every(card => card === null)) {
            directAttack();
            return;
        }

        if (!selectedUserFieldCard) {
            alert('You must select a card to attack with!');
            return;
        }

        const {card: userCard, index: userIndex} = selectedUserFieldCard;

        if (!selectedEnemyCard) {
            alert('You must select an enemy card to attack!');
            return;
        }

        const {card: enemyCard, index: enemyIndex} = selectedEnemyCard;

        if (userCard.cardAtkPoints > enemyCard.cardDefPoints) {
            setEnemyField(prev => {
                const updatedField = [...prev];
                updatedField[enemyIndex] = null;
                return updatedField;
            });
            setEnemyHp(prev => {
                const newHp = prev - (userCard.cardAtkPoints - enemyCard.cardDefPoints);
                if (newHp <= 0) {
                    endGame(enemyId);
                }
                return newHp;
            });
        } else if (enemyCard.cardAtkPoints > userCard.cardDefPoints) {
            setUserField(prev => {
                const updatedField = [...prev];
                updatedField[userIndex] = null;
                return updatedField;
            });
            setUserHp(prev => {
                const newHp = prev - (enemyCard.cardAtkPoints - userCard.cardDefPoints);
                if (newHp <= 0) {
                    endGame(userId);
                }
                return newHp;
            });
        } else {
            setEnemyField(prev => {
                const updatedField = [...prev];
                updatedField[enemyIndex] = null;
                return updatedField;
            });
            setUserField(prev => {
                const updatedField = [...prev];
                updatedField[userIndex] = null;
                return updatedField;
            });
        }

        setSelectedUserFieldCard(null);
        setSelectedEnemyCard(null);
    };

    const endGame = (loser) => {
        const endGamePayload = {
            duellId: duellId,
            userId: userId,
            enemyId: enemyId,
            loser: loser
        };

        if (tournamentInfo.tournamentId != null) {
            const tournamentEndGamePayload = {
                ...endGamePayload,
                tournamentId: tournamentInfo.tournamentId,
            };
            console.log("Sending tournamentEndGamePayload:", JSON.stringify(tournamentEndGamePayload, null, 2)); // Debugging line

            client.publish({
                destination: '/app/tournament/next-round',
                body: JSON.stringify(tournamentEndGamePayload)
            });
            navigate('/tournament/waiting');
        }

        console.log("Sending endGamePayload:", JSON.stringify(endGamePayload, null, 2)); // Debugging line

        setConsoleMessages([]);  // Clear console messages at the end of the game

        client.publish({
            destination: '/app/end-game',
            body: JSON.stringify(endGamePayload)
        });
    };


    const handleUserFieldCardSelect = (card, index) => {
        if (selectedUserFieldCard && selectedUserFieldCard.index === index) {
            setSelectedUserFieldCard(null);
        } else {
            setSelectedUserFieldCard({card, index});
        }
    };

    const handleHandCardSelect = (card, index) => {
        if (selectedHandCard && selectedHandCard.index === index) {
            setSelectedHandCard(null);
        } else {
            setSelectedHandCard({card, index});
        }
    };

    const handleEnemyCardSelect = (card, index) => {
        if (selectedEnemyCard && selectedEnemyCard.index === index) {
            setSelectedEnemyCard(null);
        } else {
            setSelectedEnemyCard({card, index});
        }
    };

    const handleDrawCardsFromDeck = () => {
        if (hand.length >= 5) {
            alert('You cannot have more than 5 cards in your hand.');
            return;
        }
        if (selectedDeckCards.length > 0) {
            const newCard = selectedDeckCards.pop();
            setHand([...hand, newCard]);
            setSelectedDeckCards([...selectedDeckCards]);
        } else {
            alert('No more cards in the deck.');
        }
    };

    const sacrificeAndPlayRareCard = () => {
        const rareCardIndex = hand.findIndex(card => card.cardRarity === 'RARE');

        if (rareCardIndex === -1) {
            alert('You do not have a rare card in your hand.');
            return;
        }

        const sacrificeCardIndex = userField.findIndex(card => card);

        if (sacrificeCardIndex === -1) {
            alert('You need at least one card on the field to perform this action.');
            return;
        }

        const updatedUserField = [...userField];
        const cardToSacrifice = updatedUserField[sacrificeCardIndex];
        updatedUserField[sacrificeCardIndex] = null;

        const emptySlotIndex = updatedUserField.findIndex(card => card === null);

        if (emptySlotIndex === -1) {
            alert('No empty slot available on the field to place the rare card.');
            return;
        }

        const updatedHand = [...hand];
        const rareCardToPlay = updatedHand[rareCardIndex];
        updatedUserField[emptySlotIndex] = rareCardToPlay;
        updatedHand.splice(rareCardIndex, 1);

        setHand(updatedHand);
        setUserField(updatedUserField);

        // Update stats for sacrifice and play
        updateStatsForCardSacrifice(cardToSacrifice, true);
        updateStatsForCardPlay(rareCardToPlay, true);
    };

    const sacrificeAndPlayLegendaryCard = () => {
        const legendaryCardIndex = hand.findIndex(card => card.cardRarity === 'LEGENDARY');

        if (legendaryCardIndex === -1) {
            alert('You do not have a legendary card in your hand.');
            return;
        }

        const sacrificeCardIndices = [];
        for (let i = 0; i < userField.length; i++) {
            if (userField[i] && sacrificeCardIndices.length < 3) {
                sacrificeCardIndices.push(i);
            }
        }

        if (sacrificeCardIndices.length < 3) {
            alert('You need at least three cards on the field to perform this action.');
            return;
        }

        const updatedUserField = [...userField];
        const cardsToSacrifice = sacrificeCardIndices.map(index => updatedUserField[index]);
        sacrificeCardIndices.forEach(index => {
            updatedUserField[index] = null;
        });

        const emptySlotIndex = updatedUserField.findIndex(card => card === null);

        if (emptySlotIndex === -1) {
            alert('No empty slot available on the field to place the legendary card.');
            return;
        }

        const updatedHand = [...hand];
        const legendaryCardToPlay = updatedHand[legendaryCardIndex];
        updatedUserField[emptySlotIndex] = legendaryCardToPlay;
        updatedHand.splice(legendaryCardIndex, 1);

        setHand(updatedHand);
        setUserField(updatedUserField);

        // Update stats for sacrifices and play
        cardsToSacrifice.forEach(card => updateStatsForCardSacrifice(card, true));
        updateStatsForCardPlay(legendaryCardToPlay, true);
    };

    const updateStatsForCardPlay = (card, isUser) => {
        const rarity = card.cardRarity.toLowerCase();
        if (isUser) {
            setUserStats(prev => ({
                ...prev,
                cardsPlayed: {
                    ...prev.cardsPlayed,
                    [rarity]: prev.cardsPlayed[rarity] + 1
                }
            }));
        } else {
            setEnemyStats(prev => ({
                ...prev,
                cardsPlayed: {
                    ...prev.cardsPlayed,
                    [rarity]: prev.cardsPlayed[rarity] + 1
                }
            }));
        }
    };

    const updateStatsForCardSacrifice = (card, isUser) => {
        const rarity = card.cardRarity.toLowerCase();
        if (isUser) {
            setUserStats(prev => ({
                ...prev,
                cardsSacrificed: {
                    ...prev.cardsSacrificed,
                    [rarity]: prev.cardsSacrificed[rarity] + 1
                }
            }));
        } else {
            setEnemyStats(prev => ({
                ...prev,
                cardsSacrificed: {
                    ...prev.cardsSacrificed,
                    [rarity]: prev.cardsSacrificed[rarity] + 1
                }
            }));
        }
    };

    const updateStatsForDamage = (damage, isUser) => {
        if (isUser) {
            setUserStats(prev => ({
                ...prev,
                totalDamage: prev.totalDamage + damage
            }));
        } else {
            setEnemyStats(prev => ({
                ...prev,
                totalDamage: prev.totalDamage + damage
            }));
        }
    };

    const handleGameEnded = (payload) => {
        const userPayload = payload;
        var loser = payload.loser.toString()

        if (loser === userId) {
            alert('You lost the game...');
            alert(`Game Ended, here are the stats! \n\nUser cards played: ${JSON.stringify(userStats.cardsPlayed)}, \n\n User cards sacrificed:  ${JSON.stringify(userStats.cardsSacrificed)} \n\n User cards damage dealt: ${userStats.totalDamage}`);
        } else {
            alert('You won the game!');
            alert(`Game Ended, here are the stats! \n\nUser cards played: ${JSON.stringify(userStats.cardsPlayed)}, \n\n User cards sacrificed:  ${JSON.stringify(userStats.cardsSacrificed)} \n\n User cards damage dealt: ${userStats.totalDamage}`);
        }
        navigate('/user/dashboard'); // Adjust the path to your User Dashboard

    };

    const handleTournamentInfo = (payload) => {
        console.log("Received payload:", payload);
        const infoPayload = payload;

        if (infoPayload.tournamentId) {
            setTournamentInfo({
                tournamentId: infoPayload.tournamentId.toString(),
                participants: infoPayload.acceptedUserIds || [],
                winnersQueue: infoPayload.winnersQueue || []
            });
            console.log("Tournament info set:", {
                tournamentId: infoPayload.tournamentId.toString(),
                participants: infoPayload.acceptedUserIds || [],
                winnersQueue: infoPayload.winnersQueue || []
            });
        } else {
            console.warn("tournamentId is undefined in infoPayload:", infoPayload);
        }
    };


    const startTimer = () => {
        setTimeLeft(30);
        timerRef.current = setInterval(() => {
            setTimeLeft((prevTime) => {
                if (prevTime <= 1) {
                    clearInterval(timerRef.current);
                    endTurn(); // Automatisch den Zug beenden, wenn die Zeit abläuft
                }
                return prevTime - 1;
            });
        }, 1000);
    };

    const clearTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="game-container">
                <h1>Fight</h1>
                <div className="life-points">
                    <div className="enemy-life-points">
                        <h2>Enemy Life Points: {enemyHp}</h2>
                        <h3>Enemy ID: {enemyId}</h3> {/* Neue Zeile hinzugefügt */}
                    </div>
                    <div className="user-life-points">
                        <h2>Your Life Points: {userHp}</h2>
                        <h3>Your ID: {userId}</h3> {/* Neue Zeile hinzugefügt */}
                    </div>
                </div>
                {gameStarted ? (
                    <>
                        <div className="game-board">
                            <div className="enemy-field">
                                {enemyField.map((card, index) => (
                                    <CardSlot
                                        key={index}
                                        card={card}
                                        index={index}
                                        moveCard={() => {
                                        }}
                                        allowDrop={false}
                                        onSelect={handleEnemyCardSelect}
                                        isSelected={selectedEnemyCard && selectedEnemyCard.index === index}
                                    />
                                ))}
                            </div>
                            <div className="user-field">
                                {currentTurnUserId === userId && (
                                    <div className="timer">
                                        <h2>Time Left: {timeLeft}s</h2>
                                    </div>
                                )}
                                {userField.map((card, index) => (
                                    <CardSlot
                                        key={index}
                                        card={card}
                                        index={index}
                                        moveCard={moveCard}
                                        allowDrop={true}
                                        onSelect={handleUserFieldCardSelect}
                                        isSelected={selectedUserFieldCard && selectedUserFieldCard.index === index}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="hand">
                            <h2>Your Hand</h2>
                            <div className="card-hand">
                                {hand.map((card, index) => (
                                    <Card
                                        key={index}
                                        card={card}
                                        index={index}
                                        moveCard={moveCard}
                                        onSelect={handleHandCardSelect}
                                        isSelected={selectedHandCard && selectedHandCard.index === index}
                                    />
                                ))}
                            </div>
                        </div>
                        <button onClick={battle} disabled={currentTurnUserId !== userId}>Battle</button>
                        <button onClick={directAttack} disabled={currentTurnUserId !== userId}>Direct Attack</button>
                        <button onClick={sacrificeAndPlayRareCard} disabled={currentTurnUserId !== userId}>Sacrifice and Play Rare Card</button>
                        <button onClick={sacrificeAndPlayLegendaryCard} disabled={currentTurnUserId !== userId}>Sacrifice and Play Legendary Card</button>
                        <button onClick={handleDrawCardsFromDeck} disabled={currentTurnUserId !== userId}>Draw Cards</button>
                        <button onClick={endTurn} disabled={currentTurnUserId !== userId}>End Turn</button>
                        <div className="console-messages">
                            <h2>Console Messages</h2>
                            <div className="messages">
                                {consoleMessages.map((msg, index) => <p key={index}>{msg}</p>)}
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        {isDeckSelected ? (
                            <div>Waiting for other player to select a deck...</div>
                        ) : (
                            <div className="deck-selection">
                                <h1>Select a Deck</h1>
                                <div className="decks">
                                    {decks.map((deck) => (
                                        <div key={deck.id} className="deck" onClick={() => selectDeck(deck)}>
                                            <h2>{deck.name}</h2>
                                            <p>Cards: {deck.cards.length}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
                {endGameStats && (
                    <div className="end-game-stats">
                        <h2>Game Over!</h2>
                        <div>
                            <h3>User Stats</h3>
                            <p>Total Damage: {endGameStats.userDamageDealt}</p>
                            <p>Cards Played: {JSON.stringify(endGameStats.userCardsPlayed)}</p>
                            <p>Cards Sacrificed: {JSON.stringify(endGameStats.userCardsSacrificed)}</p>
                        </div>
                    </div>
                )}
            </div>
        </DndProvider>
    );
};

export default GameComponent;
