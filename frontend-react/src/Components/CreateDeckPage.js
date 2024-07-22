import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function CreateDeckPage() {
    const [userCards, setUserCards] = useState([]);
    const [selectedCards, setSelectedCards] = useState({});
    const [deckName, setDeckName] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deckNameError, setDeckNameError] = useState('');
    const [deckLimitError, setDeckLimitError] = useState('');
    const [cardLimitError, setCardLimitError] = useState('');
    const [existingDecks, setExistingDecks] = useState([]);
    const navigate = useNavigate();
    const buttonStyle = { padding: '10px', backgroundColor: '#015aba', color: '#fff', border: 'none', cursor: 'pointer' };
    const hoverColor = '#003b75';

    useEffect(() => {
        const fetchCards = async () => {
            try {
                const response = await axios.get('http://localhost:8080/api/lootbox/user-cards', { withCredentials: true });
                setUserCards(response.data);
            } catch (error) {
                console.error('Fehler beim Laden der Karten:', error);
                setError('Karten konnten nicht geladen werden.');
            }
            setLoading(false);
        };

        const fetchDecks = async () => {
            try {
                const response = await axios.get('http://localhost:8080/deck/user/getAll', { withCredentials: true });
                setExistingDecks(response.data);
            } catch (error) {
                console.error('Fehler beim Laden der Decks:', error);
                setError('Decks konnten nicht geladen werden.');
            }
        };
        fetchCards();
        fetchDecks();
    }, []);

    const handleSelectCard = cardId => {
        const totalSelectedCards = Object.values(selectedCards).reduce((sum, count) => sum + count, 0);

        if (totalSelectedCards >= 30 && !selectedCards[cardId]) {
            setCardLimitError('Sie können nicht mehr als 30 Karten auswählen.');
            return;
        }

        setCardLimitError('');

        const newCount = (selectedCards[cardId] || 0) + 1 > 2 ? 2 : (selectedCards[cardId] || 0) + 1;
        setSelectedCards({ ...selectedCards, [cardId]: newCount });
    };

    const handleDeselectCard = cardId => {
        const count = (selectedCards[cardId] || 0) - 1;
        if (count > 0) {
            setSelectedCards({ ...selectedCards, [cardId]: count });
        } else {
            const newSelectedCards = { ...selectedCards };
            delete newSelectedCards[cardId];
            setSelectedCards(newSelectedCards);
        }
    };

    const handleSaveDeck = () => {
        if (!deckName) {
            setDeckNameError('Bitte geben Sie einen Decknamen ein.');
            return;
        }

        if (existingDecks.length >= 3) {
            setDeckLimitError('Sie können nicht mehr als 3 Decks erstellen.');
            return;
        }

        const selectedCardsList = Object.entries(selectedCards).map(([cardId, count]) => ({
            cardId,
            count
        }));

        const payload = {
            deckName: deckName,
            cards: selectedCardsList
        };

        console.log('Payload:', payload); // Debugging line

        axios.post('http://localhost:8080/deck/create', payload, { withCredentials: true })
            .then(() => {
                alert('Deck erfolgreich gespeichert!');
                navigate(-1); // Zur vorherigen Seite navigieren
            }).catch(error => {
            console.error('Fehler beim Speichern des Decks:', error);
            alert('Fehler beim Speichern des Decks.');
        });
    };

    if (loading) return <p>Karten werden geladen...</p>;
    if (error) return <p>Fehler: {error}</p>;

    return (
        <div className="container" style={{ padding: '20px', maxWidth: '800px', margin: 'auto' }}>
            <h1 style={{ textAlign: 'center', color: '#000205' }}>Erstelle ein neues Deck</h1>
            <input
                type="text"
                value={deckName}
                onChange={e => { setDeckName(e.target.value); setDeckNameError(''); setDeckLimitError(''); setCardLimitError(''); }}
                placeholder="Deckname eingeben"
                style={{ marginBottom: '10px', padding: '10px', width: '100%' }}
            />
            {deckNameError && <p style={{ color: 'red' }}>{deckNameError}</p>}
            {deckLimitError && <p style={{ color: 'red' }}>{deckLimitError}</p>}
            {cardLimitError && <p style={{ color: 'red' }}>{cardLimitError}</p>}
            <button onClick={handleSaveDeck} style={buttonStyle} onMouseOver={e => e.currentTarget.style.backgroundColor = hoverColor} onMouseOut={e => e.currentTarget.style.backgroundColor = '#015aba'}>
                Deck speichern
            </button>
            <h2 style={{ marginTop: '20px' }}>Gezogene Karten</h2>
            <table style={{ width: '100%', marginBottom: '20px', marginTop: '20px', borderCollapse: 'collapse' }}>
                <thead>
                <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Seltenheit</th>
                    <th>Angriffspunkte</th>
                    <th>Verteidigungspunkte</th>
                    <th>Beschreibung</th>
                    <th>Bild</th>
                    <th>Auswählen / Abwählen</th>
                </tr>
                </thead>
                <tbody>
                {userCards.map((card, index) => (
                    <tr key={`${card.cardId}-${index}`} style={{ borderBottom: '1px solid #ddd' }}>
                        <td>{card.cardId}</td>
                        <td>{card.cardName}</td>
                        <td>{card.cardRarity}</td>
                        <td>{card.cardAtkPoints}</td>
                        <td>{card.cardDefPoints}</td>
                        <td>{card.cardDescr}</td>
                        <td><img src={card.cardPictureUrl} alt={card.cardName} style={{ width: '100px', height: 'auto' }} /></td>
                        <td>
                            <button onClick={() => handleSelectCard(card.cardId)} style={buttonStyle} onMouseOver={e => e.currentTarget.style.backgroundColor = hoverColor} onMouseOut={e => e.currentTarget.style.backgroundColor = '#015aba'}>
                                + ({selectedCards[card.cardId] || 0})
                            </button>
                            <button onClick={() => handleDeselectCard(card.cardId)} style={{ ...buttonStyle, marginLeft: '10px' }} onMouseOver={e => e.currentTarget.style.backgroundColor = hoverColor} onMouseOut={e => e.currentTarget.style.backgroundColor = '#015aba'}>
                                -
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}

export default CreateDeckPage;