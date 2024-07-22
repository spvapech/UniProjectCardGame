package backend.spring.backendspring.Controller;

import backend.spring.backendspring.Dtos.DeckDto;
import backend.spring.backendspring.Model.Cards;
import backend.spring.backendspring.Model.Deck;
import backend.spring.backendspring.Repository.DeckRepository;
import backend.spring.backendspring.Service.DeckService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/deck")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class DeckController {

    private final DeckService deckService;
    private final DeckRepository deckRepository;

    public DeckController(DeckService deckService, DeckRepository deckRepository) {
        this.deckService = deckService;
        this.deckRepository = deckRepository;
    }

    @PostMapping("/create")
    public ResponseEntity<?> createDeck(
            @RequestBody DeckDto deckDto,
            @CookieValue(value = "userId", required = false) Long userId) {
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("No user logged in");
        }

        try {
            List<Cards> cardsList = new ArrayList<>(deckDto.getCards());
            return deckService.createDeck(userId, deckDto.getDeckName(), cardsList);
        } catch (Exception e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/get/{deckId}")
    public ResponseEntity<List<Cards>> getSpecificDeck(@PathVariable Long deckId, @CookieValue(value = "userId", required = false) Long userId) {
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(null);
        }
        return deckService.getSpecificDeck(deckId, userId);
    }

    @GetMapping("/getAll")
    public List<Deck> getAll() {
        return deckService.getAll();
    }

    @GetMapping("/user/getAll")
    public List<Deck> getDeckForUser(@CookieValue(value = "userId", required = false) Long userId) {
        return deckService.getDeckForUser(userId);
    }

    @PostMapping("/delete")
    public ResponseEntity<?> deleteCardsFromDeck(@CookieValue(value = "userId") Long userId, @RequestBody DeckDto deckDto) {
        List<Cards> cardsList = new ArrayList<>(deckDto.getCards());
        deckDto.setCards(cardsList);
        return deckService.deleteCardsFromDeck(userId, deckDto);
    }

    @DeleteMapping("/delete/{deckId}")
    public ResponseEntity<?> deleteDeck(@PathVariable Long deckId, @CookieValue(value = "userId", required = false) Long userId) {
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("No user logged in");
        }

        try {
            return deckService.deleteDeck(userId, deckId);
        } catch (Exception e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    @PutMapping("/edit/{deckId}")
    public ResponseEntity<?> editDeck(
            @PathVariable Long deckId,
            @RequestBody DeckDto deckDto,
            @CookieValue(value = "userId", required = false) Long userId) {
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("No user logged in");
        }

        try {
            List<Cards> cardsList = new ArrayList<>(deckDto.getCards());
            return deckService.editDeck(userId, deckId, deckDto.getDeckName(), cardsList);
        } catch (Exception e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/getByName")
    public ResponseEntity<Deck> getDeckByName(@RequestParam String name) {
        Optional<Deck> deck = deckRepository.findByName(name);
        return deck.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.status(404).build());
    }
}
