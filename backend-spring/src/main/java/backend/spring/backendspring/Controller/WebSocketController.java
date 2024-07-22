package backend.spring.backendspring.Controller;

import backend.spring.backendspring.Dtos.DuellResponseDTO;
import backend.spring.backendspring.Enum.UserStatus;
import backend.spring.backendspring.Model.Cards;
import backend.spring.backendspring.Model.DuellMode;
import backend.spring.backendspring.Model.User;
import backend.spring.backendspring.Repository.DeckRepository;
import backend.spring.backendspring.Repository.DuellModeRepository;
import backend.spring.backendspring.Repository.UserRepository;
import backend.spring.backendspring.Service.BotService;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import lombok.Data;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.*;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;

@Controller
@AllArgsConstructor
public class WebSocketController {
    private final DuellModeRepository duellModeRepository;
    private final UserRepository userRepository;
    private final DeckRepository deckRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final BotService botService;

    private Set<Long> deckSelectedList = new HashSet<>();
    private final Lock lock = new ReentrantLock();

    @MessageMapping("/online-user")
    @SendTo("/topic/status")
    public void userOnline(@Payload Long userId) {
        User user = userRepository.findById(userId).orElseThrow();
        user.setStatus(UserStatus.ONLINE);
        userRepository.save(user);
        messagingTemplate.convertAndSend("/topic/status", user);
    }

    @MessageMapping("/offline-user")
    @SendTo("/topic/status")
    public void userOffline(@Payload Long userId) {
        User user = userRepository.findById(userId).orElseThrow();
        user.setStatus(UserStatus.OFFLINE);
        userRepository.save(user);
        messagingTemplate.convertAndSend("/topic/status", user);
    }

    @MessageMapping("/invite")
    @SendTo("/topic/invite_someone")
    public ResponseEntity<?> invite(@Payload InvitePayload invitePayload) {
        User user = userRepository.findById(invitePayload.getUserId()).orElseThrow();
        User enemy = userRepository.findById(invitePayload.getEnemyId()).orElseThrow();

        if (enemy.getStatus() == UserStatus.OFFLINE) {
            return ResponseEntity.badRequest().body("User is not online");
        }
        if (enemy.getStatus() == UserStatus.INGAME) {
            return ResponseEntity.badRequest().body("User is in a game");
        }
        if (user.getDecks().size() < 1 || enemy.getDecks().size() < 1) {
            return ResponseEntity.badRequest().body("User/enemy has no deck");
        }

        if (enemy.getStatus() == UserStatus.ONLINE) {
            enemy.setGameInvitation(true);
            user.setGameInvitation(true);
            userRepository.save(user);
            userRepository.save(enemy);

            // Send the invitation to the enemy
            messagingTemplate.convertAndSend("/topic/invite_someone/" + invitePayload.getEnemyId(), invitePayload);
            System.out.println("Game invitation sent to: " + enemy.getUsername());

            if (botService.isBotUser(enemy.getId())) {
                acceptInvite(new InviteResponsePayload(user.getId(), enemy.getId(), true));
            }

            return ResponseEntity.ok("Game invitation sent");
        }

        return ResponseEntity.internalServerError().body("Something went wrong");
    }

    @MessageMapping("/accept-invite")
    @SendTo("/topic/invite/response")
    public void acceptInvite(@Payload InviteResponsePayload inviteResponsePayload) {
        lock.lock();
        try {
            Optional<DuellMode> existingDuell = duellModeRepository.findByUserIdAndEnemyId(
                    inviteResponsePayload.getUserId(), inviteResponsePayload.getEnemyId());

            if (existingDuell.isPresent()) {
                System.out.println("Strange1!");
            }

            // Fetch users
            User user = userRepository.findById(inviteResponsePayload.getUserId()).orElseThrow();
            System.out.println("userid: " + user.getId());
            User enemy = userRepository.findById(inviteResponsePayload.getEnemyId()).orElseThrow();
            System.out.println("enemyId: " + enemy.getId());

            // Update user statuses
            user.setStatus(UserStatus.INGAME);
            enemy.setStatus(UserStatus.INGAME);

            // Reset game invitation flags
            enemy.setGameInvitation(false);
            user.setGameInvitation(false);

            // Create and initialize DuellMode
            DuellMode duellMode = new DuellMode();
            duellMode.setUserId(user.getId());
            duellMode.setEnemyId(enemy.getId());
            duellMode.setEnemyField(new ArrayList<>());
            duellMode.setUserField(new ArrayList<>());
            duellMode.setCurrentTurnUserId(determineFirstTurnUserId(user.getId(), enemy.getId()));

            // Save DuellMode
            duellModeRepository.save(duellMode);

            // Associate DuellMode with users
            user.setDuellModeId(duellMode.getDuellId());
            enemy.setDuellModeId(duellMode.getDuellId());

            // Save users with updated DuellMode
            userRepository.save(user);
            userRepository.save(enemy);

            messagingTemplate.convertAndSend("/topic/invite/response/" + inviteResponsePayload.getUserId(), inviteResponsePayload);
            messagingTemplate.convertAndSend("/topic/invite/response/" + inviteResponsePayload.getEnemyId(), inviteResponsePayload);


            if (botService.isBotUser(enemy.getId())) {
                botService.autoSelectBotDeck(enemy.getId());
                allSelectedDeck(enemy.getId());
                botService.placeCardAutomatically(duellMode);
            }
        } finally {
            lock.unlock();
        }
    }

    @MessageMapping("/decline-invite")
    @SendTo("/topic/invite/response")
    public void declineInvite(@Payload InviteResponsePayload inviteResponsePayload) {
        inviteResponsePayload.setAccepted(false);
        messagingTemplate.convertAndSend("/topic/invite/response", inviteResponsePayload);

        User user = userRepository.findById(inviteResponsePayload.getUserId()).orElseThrow();
        user.setGameInvitation(false);
        userRepository.save(user);
    }

    @MessageMapping("/deck-selected")
    @SendTo("/topic/duel/deckSelected")
    public void allSelectedDeck(@Payload Long userId) {
        User user = userRepository.findById(userId).orElseThrow();

        if (user.getDuellModeId() == null) {
            // Handle the case where the user is not associated with any duell
            System.err.println("User is not associated with any duell.");
            return;
        }

        if (botService.isBotUser(userId)) {
            System.out.println("Automatically selecting deck for user ID 1");
            botService.autoSelectBotDeck(userId);
        }

        DuellMode duell = duellModeRepository.findById(user.getDuellModeId()).orElseThrow();

        deckSelectedList.add(userId);
        DuellMode duellMode = duell;
        if (deckSelectedList.contains(duellMode.getUserId()) && deckSelectedList.contains(duellMode.getEnemyId())) {
            messagingTemplate.convertAndSend("/topic/duel/start/" + duellMode.getEnemyId(), duellMode);
            messagingTemplate.convertAndSend("/topic/duel/start/" + duellMode.getUserId(), duellMode);
            messagingTemplate.convertAndSend("/topic/duel/start", duell); //vielleicht fehlerhaft
            deckSelectedList.clear();
        }
    }


    @MessageMapping("/end-turn")
    @SendTo("/topic/duel/start")
    public DuellMode endTurn(@Payload DuellPayload duellState) {
        System.out.println("Received DuellPayload: " + duellState);
        DuellMode duellMode = duellState.toDuellMode();
        duellMode.setCurrentTurnUserId(duellState.getNextTurnUserId());
        duellModeRepository.save(duellMode);
        messagingTemplate.convertAndSend("/topic/duel/start/" + duellMode.getUserId(), duellMode);
        messagingTemplate.convertAndSend("/topic/duel/start/" + duellMode.getEnemyId(), duellMode);
        //vielleicht fehlerhaft

        if (botService.isBotUser(duellMode.getCurrentTurnUserId())) {
            botService.placeCardAutomatically(duellMode);
        } else {
            messagingTemplate.convertAndSend("/topic/gaming/progress", duellMode);
        }

        return duellMode;
    }

    @MessageMapping("/end-game")
    @SendTo("/topic/duel/endGame")
    @Transactional
    public void endGame(@Payload EndGamePayload payload) {
        // Find and delete the duell
        duellModeRepository.deleteById(payload.getDuellId());

        // Update user statuses
        User user = userRepository.findById(payload.getUserId()).orElseThrow();
        user.setStatus(UserStatus.ONLINE);
        user.setDuellModeId(null);

        User enemy = userRepository.findById(payload.getEnemyId()).orElseThrow();
        enemy.setStatus(UserStatus.ONLINE);
        enemy.setDuellModeId(null);

        messagingTemplate.convertAndSend("/topic/duel/endGame/" + payload.getUserId(), payload);
        messagingTemplate.convertAndSend("/topic/duel/endGame/" + payload.getEnemyId(), payload);

        duellModeRepository.deleteById(payload.getDuellId());

        // Calculate SEP-Coins and Leaderboard points
        User loser = userRepository.findById(payload.loser).orElseThrow();

        if (user.getTournamentId() == null) {
            if (loser != user) {
                user.setSEP_Coins(user.getSEP_Coins() + 100);
                user.setRank((Math.abs(enemy.getRank() - user.getRank())) + 50);
                enemy.setRank((Math.abs(user.getRank() - enemy.getRank()) + 50) / 2);
            } else {
                enemy.setSEP_Coins(enemy.getSEP_Coins() + 100);
                enemy.setRank(Math.abs(user.getRank() - enemy.getRank()) + 50);
                user.setRank((Math.abs(user.getRank() - enemy.getRank()) + 50) / 2);
            }
        }

        // Save user and enemy
        userRepository.save(user);
        userRepository.save(enemy);

        messagingTemplate.convertAndSend("/topic/duel/endGame", payload); //könnte Probleme beim enden des spiels machen
    }

    private Long determineFirstTurnUserId(Long userId, Long enemyId) {
        Long firstTurnUserId = Math.random() < 0.5 ? userId : enemyId;
        System.out.println("Determined first turn user ID: " + firstTurnUserId);
        return firstTurnUserId;
    }

    private DuellResponseDTO createDuellResponseDTO(DuellMode duellMode) {
        DuellResponseDTO responseDTO = new DuellResponseDTO();
        responseDTO.setDuellId(duellMode.getDuellId());
        responseDTO.setUserId(duellMode.getUserId());
        responseDTO.setUserHp(50);
        responseDTO.setUserCards(null);
        responseDTO.setEnemyId(duellMode.getEnemyId());
        responseDTO.setEnemyHp(50);
        responseDTO.setEnemyCards(null);
        responseDTO.setCurrentTurnUserId(duellMode.getCurrentTurnUserId());
        return responseDTO;
    }

    @Data
    public static class DuellPayload {
        private Long duellId;
        private Long userId;
        private Long enemyId;
        private List<Cards> userField;
        private List<Cards> enemyField;
        private int userHp;
        private int enemyHp;
        private Long nextTurnUserId;

        public DuellMode toDuellMode() {
            DuellMode duellMode = new DuellMode();
            duellMode.setDuellId(this.duellId);
            duellMode.setUserId(this.userId);
            duellMode.setEnemyId(this.enemyId);
            duellMode.setUserField(this.userField);
            duellMode.setEnemyField(this.enemyField);
            duellMode.setUserHp(this.userHp);
            duellMode.setEnemyHp(this.enemyHp);
            duellMode.setCurrentTurnUserId(this.nextTurnUserId);
            return duellMode;
        }
    }

    @Data
    public static class EndGamePayload {
        private Long duellId;
        private Long userId;
        private Long enemyId;
        private Long loser;
        private int userHp;
        private int enemyHp;
    }

    @Data
    @AllArgsConstructor
    public static class InvitePayload {
        private Long userId;
        private Long enemyId;
    }

    @Data
    @AllArgsConstructor
    public static class InviteResponsePayload {
        private Long userId;
        private Long enemyId;
        private boolean accepted;
    }
}
