package backend.spring.backendspring.Service;

import backend.spring.backendspring.Enum.Rarity;
import backend.spring.backendspring.Model.Cards;
import backend.spring.backendspring.Model.User;
import backend.spring.backendspring.Repository.CardsRepository;
import backend.spring.backendspring.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Random;
import java.util.Set;

@RequiredArgsConstructor
@Service
public class LootBoxService {
    private final CardsRepository cardsRepository;
    private final UserRepository userRepository;

    public List<Cards> getRandomCards(Long userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));


        if(!user.isTokenForLootbox()) {
            if (user.getSEP_Coins() < 250) {
                throw new RuntimeException("U BROKE AF!");
            }
            user.setSEP_Coins(user.getSEP_Coins() - 250);
            userRepository.save(user);
        }

        user.setTokenForLootbox(false);
        List<Cards> drawnCards = new ArrayList<>();
        Random random = new Random();

        for (int i = 0; i < 5; i++) {
            int chance = random.nextInt(100) + 1;
            if (chance <= 15) {
                drawnCards.add(getRandomCard(Rarity.LEGENDARY));
            } else if (chance <= 40) {
                drawnCards.add(getRandomCard(Rarity.RARE));
            } else if (chance <= 65) {
                drawnCards.add(getRandomCard(Rarity.RARE));
            } else {
                drawnCards.add(getRandomCard(Rarity.COMMON));
            }
        }

        // Erstelle ein Set für bereits vorhandene Karten des Nutzers
        Set<Cards> userCardsSet = new HashSet<>(user.getCards());

        // Füge nur neue Karten hinzu
        for (Cards card : drawnCards) {
            if (!userCardsSet.contains(card)) {
                user.getCards().add(card);
                userCardsSet.add(card);
            }
        }
        userRepository.save(user);
        return drawnCards;
    }

    private Cards getRandomCard(Rarity rarity) {
        List<Cards> cardsList = cardsRepository.findAllByCardRarity(rarity);
        if (cardsList.isEmpty()) {
            throw new RuntimeException("No cards available for rarity: " + rarity);
        }
        Random random = new Random();
        return cardsList.get(random.nextInt(cardsList.size()));
    }
}