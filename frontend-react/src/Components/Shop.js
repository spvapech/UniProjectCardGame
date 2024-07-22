import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const Shop = () => {
    const [cards, setCards] = useState([]);
    const [error, setError] = useState(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const audioRef = useRef(null);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.load();
        }
    }, []);

    const openLootBox = async () => {
        try {
            setIsAnimating(true);
            setCards([]);
            if (audioRef.current) {
                audioRef.current.play().catch(err => console.error('Error playing audio', err));
            }
            const response = await axios.get('http://localhost:8080/api/lootbox/open', { withCredentials: true });
            setTimeout(() => {
                setCards(response.data);
                setError(null);
                setIsAnimating(false);
            }, 3000);
        } catch (error) {
            console.error('Error opening loot box', error);
            setError(error.response?.data || 'An error occurred');
            setIsAnimating(false);
        }
    };

    useEffect(() => {
        if (audioRef.current && !isAnimating) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
    }, [isAnimating]);

    return (
        <div className="shop-container">
            <h1> </h1>
            <button
                className={`lootbox-button ${isAnimating ? 'animating' : ''}`}
                onClick={openLootBox}
                disabled={isAnimating}
            >
                <img src="http://localhost:8080/uploads/boosterpack.png" alt="Open Loot Box" className="lootbox-image" />
            </button>
            <audio ref={audioRef} src="http://localhost:8080/uploads/sound.mp3" preload="auto" />
            {error && <div style={{ color: 'white', marginTop: '10px' }}>{error}</div>}
            <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', marginTop: '20px' }}>
                {cards.map((card) => (
                    <div key={card.cardId} className="card-container">
                        <img src={card.cardPictureUrl} alt={card.cardName} className="card-image" />
                    </div>
                ))}
            </div>
            <style>{`
                .shop-container {
                    text-align: center;
                    background-image: url('http://localhost:8080/uploads/shop.png');
                    background-size: cover;
                    background-position: center;
                    min-height: 100vh;
                    padding: 20px;
                    box-sizing: border-box;
                }
                .lootbox-button {
                    border: none;
                    background: none;
                    padding: 0;
                    transition: transform 0.2s, box-shadow 0.2s;
                }
                .lootbox-button:hover {
                    transform: scale(1.2);
                }
                .lootbox-button.animating .lootbox-image {
                    animation: shake 3s ease-in-out;
                }
                @keyframes shake {
                    0% {
                        transform: translateX(0);
                    }
                    10% {
                        transform: translateX(-5px);
                    }
                    20% {
                        transform: translateX(5px);
                    }
                    30% {
                        transform: translateX(-10px);
                    }
                    40% {
                        transform: translateX(10px);
                    }
                    50% {
                        transform: translateX(-20px);
                    }
                    60% {
                        transform: translateX(20px);
                    }
                    70% {
                        transform: translateX(-30px);
                    }
                    80% {
                        transform: translateX(30px);
                    }
                    90% {
                        transform: translateX(-40px);
                    }
                    100% {
                        transform: translateX(40px);
                    }
                }
                .lootbox-image {
                    width: 300px;
                    height: auto;
                }
                .card-container {
                    width: 200px;
                    margin: 10px;
                    transition: transform 0.2s;
                }
                .card-container:hover {
                    transform: scale(1.5);
                }
                .card-image {
                    width: 100%;
                    height: auto;
                    object-fit: contain;
                }
            `}</style>
        </div>
    );
};

export default Shop;
