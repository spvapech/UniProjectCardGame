package backend.spring.backendspring;

import backend.spring.backendspring.Controller.LootBoxController;
import backend.spring.backendspring.Model.Cards;
import backend.spring.backendspring.Model.User;
import backend.spring.backendspring.Service.LootBoxService;
import backend.spring.backendspring.Repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

public class LootBoxControllerTest {

    @Mock
    private LootBoxService lootBoxService;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private LootBoxController lootBoxController;

    @BeforeEach
    public void setup() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    public void testGetRandomCards_Success() {
        Long userId = 1L;
        List<Cards> cards = new ArrayList<>();
        when(lootBoxService.getRandomCards(userId)).thenReturn(cards);

        ResponseEntity<?> response = lootBoxController.getRandomCards(userId);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(cards, response.getBody());
    }

    @Test
    public void testGetRandomCards_Exception() {
        Long userId = 1L;
        when(lootBoxService.getRandomCards(userId)).thenThrow(new RuntimeException("User not found"));

        ResponseEntity<?> response = lootBoxController.getRandomCards(userId);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("User not found", response.getBody());
    }

    @Test
    public void testGetUserCards_Success() {
        Long userId = 1L;
        User user = new User();
        List<Cards> cards = new ArrayList<>();
        user.setCards(cards);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        ResponseEntity<?> response = lootBoxController.getUserCards(userId);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(cards, response.getBody());
    }

    @Test
    public void testGetUserCards_Exception() {
        Long userId = 1L;
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        ResponseEntity<?> response = lootBoxController.getUserCards(userId);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("User not found", response.getBody());
    }
}
