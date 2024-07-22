package backend.spring.backendspring.Controller;

import backend.spring.backendspring.Model.Cards;
import backend.spring.backendspring.Service.CardsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.List;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/card/add")
@RequiredArgsConstructor
public class CardsController {

    private final CardsService cardsService;

    @PostMapping(value = "/upload", consumes = {"multipart/form-data"})
    public ResponseEntity<Integer> uploadCards(@RequestPart("file") MultipartFile file) throws IOException {
        return ResponseEntity.ok(cardsService.uploadCards(file));
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<String> deleteCard(@PathVariable("id") Long id) {
        if (!cardsService.existsById(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("File with ID " + id + " not found.");
        }
        cardsService.deleteCardById(id);
        return ResponseEntity.ok("File deleted successfully");
    }

    @GetMapping("/getCards")
    public ResponseEntity<List<Cards>> getAllCards() {
        List<Cards> allCards = cardsService.getAllCards();
        return ResponseEntity.ok(allCards);
    }
}
