package backend.spring.backendspring.Service;

import backend.spring.backendspring.Controller.WebSocketController;
import backend.spring.backendspring.Enum.Rarity;
import backend.spring.backendspring.Enum.UserStatus;
import backend.spring.backendspring.Model.Cards;
import backend.spring.backendspring.Model.Deck;
import backend.spring.backendspring.Model.DuellMode;
import backend.spring.backendspring.Model.User;
import backend.spring.backendspring.Repository.DeckRepository;
import backend.spring.backendspring.Repository.DuellModeRepository;
import backend.spring.backendspring.Repository.UserRepository;
import lombok.AllArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@AllArgsConstructor
public class BotService {
    private final UserRepository userRepository;
    private final DeckRepository deckRepository;
    private final DuellModeRepository duellModeRepository;
    private final SimpMessagingTemplate messagingTemplate;

    private static final Long BOT_USER_ID = 1L;

    public void autoSelectBotDeck(Long botUserId) {
        User botUser = userRepository.findById(botUserId).orElseThrow(() -> new RuntimeException("Bot user not found"));
        Deck defaultDeck = deckRepository.findByName("Bot's Deck").orElseThrow(() -> new RuntimeException("Default deck not found"));
        botUser.setSelectedDeck(defaultDeck);
        userRepository.save(botUser);
    }

    public boolean isBotUser(Long userId) {
        return BOT_USER_ID.equals(userId);
    }

    @Transactional
    public void placeCardAutomatically(DuellMode duellMode) {
        User botUser = userRepository.findById(duellMode.getEnemyId()).orElseThrow(() -> new RuntimeException("Bot user not found"));
        List<Cards> hand = botUser.getSelectedDeck().getCards();

        if (hand.isEmpty()) {
            messagingTemplate.convertAndSend("/topic/console", "Bot has no cards to place.");
            return;
        }

        List<Cards> field = duellMode.getEnemyField();
        boolean cardPlaced = false;

        while (!hand.isEmpty() && !cardPlaced) {
            Cards cardToPlace = hand.remove(0);

            if (cardToPlace.getCardRarity().equals(Rarity.LEGENDARY)) {
                int requiredSacrifices = 3;
                int availableSacrifices = countCommonAndRareCards(field);
                if (availableSacrifices >= requiredSacrifices) {
                    removeCommonAndRareCardsFromField(field, requiredSacrifices);
                    cardPlaced = true;
                } else {
                    messagingTemplate.convertAndSend("/topic/console", "Not enough common or rare cards to place legendary card: " + cardToPlace.getCardName());
                    hand.add(cardToPlace); // Put the card back to hand
                }
            } else if (cardToPlace.getCardRarity().equals(Rarity.RARE)) {
                int requiredSacrifices = 1;
                int availableSacrifices = countCommonAndRareCards(field);
                if (availableSacrifices >= requiredSacrifices) {
                    removeCommonAndRareCardsFromField(field, requiredSacrifices);
                    cardPlaced = true;
                } else {
                    messagingTemplate.convertAndSend("/topic/console", "Not enough common or rare cards to place rare card: " + cardToPlace.getCardName());
                    hand.add(cardToPlace); // Put the card back to hand
                }
            } else {
                cardPlaced = true;
            }

            if (cardPlaced) {
                for (int i = 0; i < field.size(); i++) {
                    if (field.get(i) == null) {
                        cardToPlace.setNewlyPlaced(true); // Mark the card as newly placed
                        field.set(i, cardToPlace);
                        messagingTemplate.convertAndSend("/topic/console", "Bot placed card: " + cardToPlace.getCardName());
                        break;
                    }
                }
            }
        }

        duellMode.setEnemyField(field);
        duellModeRepository.save(duellMode);
        messagingTemplate.convertAndSend("/topic/gaming/progress", duellMode);

        attackWithCardAutomatically(duellMode);
    }

    private int countCommonAndRareCards(List<Cards> field) {
        int count = 0;
        for (Cards card : field) {
            if (card != null && (card.getCardRarity().equals(Rarity.COMMON) || card.getCardRarity().equals(Rarity.RARE))) {
                count++;
            }
        }
        return count;
    }

    private void removeCommonAndRareCardsFromField(List<Cards> field, int numberOfCardsToRemove) {
        int removedCount = 0;
        for (int i = 0; i < field.size() && removedCount < numberOfCardsToRemove; i++) {
            if (field.get(i) != null && (field.get(i).getCardRarity().equals(Rarity.COMMON) || field.get(i).getCardRarity().equals(Rarity.RARE))) {
                field.set(i, null);
                removedCount++;
            }
        }
        if (removedCount > 0) {
            messagingTemplate.convertAndSend("/topic/console", removedCount + " common or rare cards removed from the field.");
        }
    }

    @Transactional
    public void attackWithCardAutomatically(DuellMode duellMode) {
        List<Cards> botField = duellMode.getEnemyField();
        List<Cards> userField = duellMode.getUserField();
        int userHp = duellMode.getUserHp();
        int enemyHp = duellMode.getEnemyHp();

        for (int botIndex = 0; botIndex < botField.size(); botIndex++) {
            Cards botCard = botField.get(botIndex);

            if (botCard == null || botCard.isNewlyPlaced()) continue; // Skip newly placed cards

            Cards userCard = null;
            int userCardIndex = -1;
            for (int userIndex = 0; userIndex < userField.size(); userIndex++) {
                if (userField.get(userIndex) != null) {
                    userCard = userField.get(userIndex);
                    userCardIndex = userIndex;
                    break;
                }
            }

            int damage = 0;

            if (userCard != null) {
                messagingTemplate.convertAndSend("/topic/console", "Bot card attacking: " + botCard.getCardName() + " -> User card defending: " + userCard.getCardName());

                int damageToUserCard = botCard.getCardAtkPoints() - userCard.getCardDefPoints();
                int damageToBotCard = userCard.getCardAtkPoints() - botCard.getCardDefPoints();

                if (damageToUserCard > 0) {
                    userCard.setCardDefPoints(userCard.getCardDefPoints() - damageToUserCard);
                    messagingTemplate.convertAndSend("/topic/console", "User card " + userCard.getCardName() + " took " + damageToUserCard + " damage.");
                }
                if (damageToBotCard > 0) {
                    botCard.setCardDefPoints(botCard.getCardDefPoints() - damageToBotCard);
                    messagingTemplate.convertAndSend("/topic/console", "Bot card " + botCard.getCardName() + " took " + damageToBotCard + " damage.");
                }

                if (userCard.getCardDefPoints() <= 0) {
                    userField.set(userCardIndex, null);
                    duellMode.getUserDeadCards().add(userCard);
                    messagingTemplate.convertAndSend("/topic/console", "User card " + userCard.getCardName() + " is destroyed.");
                }
                if (botCard.getCardDefPoints() <= 0) {
                    botField.set(botIndex, null);
                    duellMode.getEnemyDeadCards().add(botCard);
                    messagingTemplate.convertAndSend("/topic/console", "Bot card " + botCard.getCardName() + " is destroyed.");
                }

                damage = Math.max(botCard.getCardAtkPoints() - userCard.getCardDefPoints(), 0);
            } else {
                damage = botCard.getCardAtkPoints();
                messagingTemplate.convertAndSend("/topic/console", "Direct attack to user with card: " + botCard.getCardName() + " causing " + damage + " damage.");
            }

            userHp -= damage;
            messagingTemplate.convertAndSend("/topic/console", "User's life points reduced by " + damage + ". Remaining life points: " + userHp);

            if (userHp <= 0) {
                endGame(duellMode, duellMode.getEnemyId());
                return;
            }

            duellMode.setUserField(userField);
            duellMode.setEnemyField(botField);
            duellMode.setUserHp(userHp);
            duellModeRepository.save(duellMode);
            messagingTemplate.convertAndSend("/topic/gaming/progress", duellMode);

            if (botCard.getCardDefPoints() <= 0) {
                break;
            }
        }

        endBotTurn(duellMode);
    }

    private void endGame(DuellMode duellMode, Long winnerId) {
        WebSocketController.EndGamePayload payload = new WebSocketController.EndGamePayload();
        payload.setDuellId(duellMode.getDuellId());
        payload.setUserId(duellMode.getUserId());
        payload.setEnemyId(duellMode.getEnemyId());
        payload.setUserHp(duellMode.getUserHp());
        payload.setEnemyHp(duellMode.getEnemyHp());

        duellModeRepository.deleteById(duellMode.getDuellId());

        User user = userRepository.findById(duellMode.getUserId()).orElseThrow();
        User enemy = userRepository.findById(duellMode.getEnemyId()).orElseThrow();
        user.setStatus(UserStatus.ONLINE);
        enemy.setStatus(UserStatus.ONLINE);

        userRepository.save(user);
        userRepository.save(enemy);

        messagingTemplate.convertAndSend("/topic/duel/endGame", payload);
    }

    private void endBotTurn(DuellMode duellMode) {
        duellMode.setCurrentTurnUserId(duellMode.getUserId());

        for (Cards card : duellMode.getEnemyField()) {
            if (card != null && card.isNewlyPlaced()) {
                card.setNewlyPlaced(false);
            }
        }

        duellModeRepository.save(duellMode);
        messagingTemplate.convertAndSend("/topic/gaming/progress", duellMode);
        messagingTemplate.convertAndSend("/topic/console", "Bot turn ended.");
    }
}
