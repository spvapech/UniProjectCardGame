import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

function EditPage() {
    const [deckCards, setDeckCards] = useState([]);
    const [availableCards, setAvailableCards] = useState([]);
    const [selectedCards, setSelectedCards] = useState({});
    const [deckName, setDeckName] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { deckId } = useParams();
    const buttonStyle = { padding: '10px', backgroundColor: '#015aba', color: '#fff', border: 'none', cursor: 'pointer' };
    const hoverColor = '#003b75';

    useEffect(() => {
        const fetchDeckCards = async () => {
            try {
                const response = await axios.get(`http://localhost:8080/deck/get/${deckId}`, { withCredentials: true });
                setDeckCards(response.data);
                const initialSelectedCards = {};
                response.data.forEach(card => {
                    initialSelectedCards[card.cardId] = (initialSelectedCards[card.cardId] || 0) + 1;
                });
                setSelectedCards(initialSelectedCards);
            } catch (error) {
                console.error('Error loading cards:', error);
                setError('Cards could not be loaded.');
            }
            setLoading(false);
        };

        const fetchAllCards = async () => {
            try {
                const response = await axios.get('http://localhost:8080/api/lootbox/user-cards', { withCredentials: true });
                const allCards = response.data;
                const deckCardIds = new Set(deckCards.map(card => card.cardId));
                const filteredAvailableCards = allCards.filter(card => !deckCardIds.has(card.cardId));
                setAvailableCards(filteredAvailableCards);
            } catch (error) {
                console.error('Error loading cards:', error);
                setError('Cards could not be loaded.');
            }
            setLoading(false);
        };

        fetchDeckCards();
        fetchAllCards();
    }, [deckId]);

    const handleSelectCard = cardId => {
        setSelectedCards(prevSelectedCards => {
            const cardCount = prevSelectedCards[cardId] || 0;
            if (cardCount >= 2) {
                alert('Cannot select more than 2 of the same card.');
                return prevSelectedCards;
            }
            const newCount = cardCount + 1;
            return { ...prevSelectedCards, [cardId]: newCount };
        });
    };

    const handleDeselectCard = cardId => {
        setSelectedCards(prevSelectedCards => {
            const newCount = (prevSelectedCards[cardId] || 0) - 1;
            if (newCount > 0) {
                return { ...prevSelectedCards, [cardId]: newCount };
            } else {
                const newSelectedCards = { ...prevSelectedCards };
                delete newSelectedCards[cardId];
                return newSelectedCards;
            }
        });
    };

    const handleSaveDeck = () => {
        const selectedCardsList = Object.entries(selectedCards).map(([cardId, count]) => ({ cardId, count }));

        const payload = {
            deckName: deckName,
            cards: selectedCardsList
        };
        console.log("Payload:", payload);
        axios.put(`http://localhost:8080/deck/edit/${deckId}`, payload, { withCredentials: true })
            .then(() => {
                alert('Deck saved successfully!');
                navigate(-1);
            }).catch(error => {
            console.error('Error saving deck:', error);
            alert('Error saving deck.');
        });
    };

    const handleDeleteDeck = () => {
        if (window.confirm("Do you really want to delete this deck?")) {
            axios.delete(`http://localhost:8080/deck/delete/${deckId}`, { withCredentials: true })
                .then(() => {
                    alert('Deck deleted successfully!');
                    navigate(-1);
                }).catch(error => {
                console.error('Error deleting deck:', error);
                alert('Error deleting deck.');
            });
        }
    };

    if (loading) return <p>Loading cards...</p>;
    if (error) return <p>Error: {error}</p>;

    return (
        <div className="container" style={{ padding: '20px', maxWidth: '800px', margin: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ textAlign: 'center', color: '#000205' }}>Edit Deck</h1>
                <button onClick={handleDeleteDeck} style={buttonStyle} onMouseOver={e => e.currentTarget.style.backgroundColor = hoverColor} onMouseOut={e => e.currentTarget.style.backgroundColor = '#015aba'}>
                    Delete Deck
                </button>
            </div>
            <input
                type="text"
                value={deckName}
                onChange={e => setDeckName(e.target.value)}
                placeholder="Enter deck name"
                style={{ marginBottom: '10px', padding: '10px', width: '100%' }}
            />
            <button onClick={handleSaveDeck} style={buttonStyle} onMouseOver={e => e.currentTarget.style.backgroundColor = hoverColor} onMouseOut={e => e.currentTarget.style.backgroundColor = '#015aba'}>
                Save Deck
            </button>
            <h2>Deck Cards</h2>
            <table style={{ width: '100%', marginBottom: '20px', marginTop: '20px', borderCollapse: 'collapse' }}>
                <thead>
                <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Rarity</th>
                    <th>Attack Points</th>
                    <th>Defense Points</th>
                    <th>Description</th>
                    <th>Picture</th>
                    <th>Select / Deselect</th>
                </tr>
                </thead>
                <tbody>
                {deckCards.map((card, index) => (
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

            <h2>All Cards</h2>
            <table style={{ width: '100%', marginBottom: '20px', marginTop: '20px', borderCollapse: 'collapse' }}>
                <thead>
                <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Rarity</th>
                    <th>Attack Points</th>
                    <th>Defense Points</th>
                    <th>Description</th>
                    <th>Picture</th>
                    <th>Select / Deselect</th>
                </tr>
                </thead>
                <tbody>
                {availableCards.map((card, index) => (
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

export default EditPage;