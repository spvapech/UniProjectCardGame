package backend.spring.backendspring.Service;

import backend.spring.backendspring.Dtos.DeckDto;
import backend.spring.backendspring.Model.Cards;
import backend.spring.backendspring.Model.Deck;
import backend.spring.backendspring.Model.User;
import backend.spring.backendspring.Repository.DeckRepository;
import backend.spring.backendspring.Repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class DeckService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DeckRepository deckRepository;

    @Transactional
    public ResponseEntity<?> createDeck(Long userId, String deckName, List<Cards> cards) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getDecks().size() == 3) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Not more than 3 decks!!!!");
        }

        // Create and save the new deck
        Deck deck = new Deck();
        deck.setName(deckName);
        deck.setCards(processCards(cards));
        deckRepository.save(deck);

        user.getDecks().add(deck);
        userRepository.save(user);

        return ResponseEntity.status(HttpStatus.CREATED).body("Deck created successfully");
    }

    public List<Deck> getAll() {
        return deckRepository.findAll();
    }

    @Transactional
    public ResponseEntity<List<Cards>> getSpecificDeck(Long deckId, Long userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        Deck deck = deckRepository.findById(deckId).orElseThrow(() -> new RuntimeException("Deck not found"));

        if (user.getDecks().contains(deck)) {
            return ResponseEntity.ok().body(deck.getCards());
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
    }

    public List<Deck> getDeckForUser(Long userId) {
        User user = userRepository.findById(userId).orElseThrow();
        return user.getDecks();
    }

    public ResponseEntity<?> deleteCardsFromDeck(Long userId, DeckDto deckDto) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));

        // Find the deck with the given name
        Deck deckToUpdate = null;
        for (Deck deck : user.getDecks()) {
            if (deck.getName().equals(deckDto.getDeckName())) {
                deckToUpdate = deck;
                break;
            }
        }

        if (deckToUpdate == null) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Deck not found");
        }

        // Clear the existing cards and add the new ones
        deckToUpdate.getCards().clear();
        deckToUpdate.getCards().addAll(processCards(deckDto.getCards()));
        deckRepository.save(deckToUpdate);

        // Save the user with the updated deck
        userRepository.save(user);

        return ResponseEntity.ok("Deck updated!");
    }

    @Transactional
    public ResponseEntity<?> deleteDeck(Long userId, Long deckId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        Deck deck = deckRepository.findById(deckId).orElseThrow(() -> new RuntimeException("Deck not found"));

        if (user.getDecks().contains(deck)) {
            user.getDecks().remove(deck);
            deckRepository.delete(deck);
            return ResponseEntity.ok().body("Deck deleted successfully");
        } else {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("User does not own this deck");
        }
    }

    @Transactional
    public ResponseEntity<?> editDeck(Long userId, Long deckId, String deckName, List<Cards> cards) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        Deck deck = deckRepository.findById(deckId).orElseThrow(() -> new RuntimeException("Deck not found"));

        if (user.getDecks().contains(deck)) {
            deck.setName(deckName);
            deck.setCards(processCards(cards));
            deckRepository.save(deck);
            return ResponseEntity.ok().body("Deck edited successfully");
        } else {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("User does not own this deck");
        }
    }

    private List<Cards> processCards(List<Cards> cards) {
        List<Cards> processedCards = new ArrayList<>();
        for (Cards card : cards) {
            for (int i = 0; i < card.getCount(); i++) {
                processedCards.add(card);
            }
        }
        return processedCards;
    }
}