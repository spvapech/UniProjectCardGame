package backend.spring.backendspring.Controller;

import backend.spring.backendspring.Model.Cards;
import backend.spring.backendspring.Model.User;
import backend.spring.backendspring.Service.LootBoxService;
import backend.spring.backendspring.Repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/lootbox")
@RequiredArgsConstructor
public class LootBoxController {

    private final LootBoxService lootBoxService;
    private final UserRepository userRepository;

    @GetMapping("/open")
    public ResponseEntity<?> getRandomCards(@CookieValue(value = "userId", required = true) Long userId) {
        try {
            List<Cards> cards = lootBoxService.getRandomCards(userId);
            return ResponseEntity.ok(cards);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @Transactional
    @GetMapping("/user-cards")
    public ResponseEntity<?> getUserCards(@CookieValue(value = "userId", required = false) Long userId) {
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Not logged in");
        }
        try {
            User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
            return ResponseEntity.ok(user.getCards());
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }
}
