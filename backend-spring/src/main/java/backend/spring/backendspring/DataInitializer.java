package backend.spring.backendspring;

import backend.spring.backendspring.CSV.CardsCsvSample;
import backend.spring.backendspring.Enum.Rarity;
import backend.spring.backendspring.Model.*;
import backend.spring.backendspring.Enum.UserStatus;
import backend.spring.backendspring.Repository.CardsRepository;
import backend.spring.backendspring.Repository.ClanRepository;
import backend.spring.backendspring.Repository.DeckRepository;
import backend.spring.backendspring.Repository.UserRepository;
import com.opencsv.bean.CsvToBean;
import com.opencsv.bean.CsvToBeanBuilder;
import com.opencsv.bean.HeaderColumnNameMappingStrategy;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
public class DataInitializer {

    private final UserRepository userRepository;
    private final DeckRepository deckRepository;
    private final CardsRepository cardsRepository;
    private final ClanRepository clanRepository;

    @Autowired
    public DataInitializer(UserRepository userRepository, DeckRepository deckRepository, CardsRepository cardsRepository, ClanRepository clanRepository) {
        this.userRepository = userRepository;
        this.deckRepository = deckRepository;
        this.cardsRepository = cardsRepository;
        this.clanRepository = clanRepository;
    }

    @PostConstruct
    public void init() {
        loadCardsFromCsv();
        initializeBotUser();
        createUser("irfan", "irfan");
        createUser("vaios", "vaios");
        createUser("karina", "karina");
        createUser("f", "f");
        createUser("opera", "opera");
        createUser("opera2", "opera2");
    }

    private void loadCardsFromCsv() {
        if (cardsRepository.count() == 0) {
            try (InputStream is = getClass().getResourceAsStream("/uploads/cards.csv")) {
                if (is == null) {
                    throw new IllegalArgumentException("File not found: cards.csv");
                }
                Reader reader = new InputStreamReader(is);

                HeaderColumnNameMappingStrategy<CardsCsvSample> mapStrategy = new HeaderColumnNameMappingStrategy<>();
                mapStrategy.setType(CardsCsvSample.class);

                CsvToBean<CardsCsvSample> csvToBean = new CsvToBeanBuilder<CardsCsvSample>(reader)
                        .withMappingStrategy(mapStrategy)
                        .withIgnoreEmptyLine(true)
                        .withIgnoreLeadingWhiteSpace(true)
                        .build();

                List<Cards> cards = csvToBean.parse()
                        .stream()
                        .map(csvObject -> Cards.builder()
                                .cardName(csvObject.getName())
                                .cardRarity(csvObject.getRarity())
                                .cardAtkPoints(csvObject.getAtk())
                                .cardDefPoints(csvObject.getDef())
                                .cardDescr(csvObject.getDesc())
                                .cardPictureUrl(csvObject.getImgUrl())
                                .build()
                        )
                        .collect(Collectors.toList());

                cardsRepository.saveAll(cards);
                System.out.println(cards.size() + " cards have been loaded and saved.");
            } catch (Exception e) {
                e.printStackTrace();
            }
        } else {
            System.out.println("Cards already exist in the database.");
        }
    }

    private void initializeBotUser() {
        if (userRepository.findById(1L).isEmpty()) {
            User botUser = new User("BotFirstName", "BotLastName", "Bot", "password", "bot@example.com", null, LocalDate.now());
            botUser.setId(1L);
            botUser.setSEP_Coins(0);
            botUser.setRank(9999);
            botUser.setStatus(UserStatus.ONLINE);

            // Create and assign a deck
            Deck botDeck = new Deck();
            botDeck.setName("Bot's Deck");

            // Add cards to the deck
            List<Cards> botCards = new ArrayList<>();

            Cards card30 = cardsRepository.findById(30L).orElse(null);
            Cards card20 = cardsRepository.findById(20L).orElse(null);

            for (long i = 1; i < 11; i++) {
                Cards card = cardsRepository.findById(i).orElse(null);
                if (card != null) {
                    botCards.add(card);
                }
                botCards.add(card30);
            }
            if (card20 != null) {
                botCards.add(card20);
            }
            if (card20 != null) {
                botCards.add(card30);
            }

            botDeck.setCards(botCards);
            deckRepository.save(botDeck);

            botUser.setDecks(Collections.singletonList(botDeck));
            userRepository.save(botUser);

            System.out.println("Bot user has been initialized with a deck of cards.");
        } else {
            System.out.println("Bot user already exists.");
        }
    }

    private void createUser(String username, String password) {
        Optional<Clan> optionalClan = Optional.ofNullable(clanRepository.findByName("SEPCLAN"));

        Clan clan;
        if (optionalClan.isPresent()) {
            clan = optionalClan.get();
        } else {
            clan = new Clan();
            clan.setName("SEPCLAN");
            clanRepository.save(clan);
        }

        Optional<User> existingUser = Optional.ofNullable(userRepository.findByUsername(username));
        if (existingUser.isEmpty()) {
            User user = new User();
            user.setUsername(username);
            user.setPassword(password);
            user.setSEP_Coins(500);
            user.setRank(50);
            user.setDate(LocalDate.now());
            user.setStatus(UserStatus.OFFLINE);
            user.setEmail(username + "@example.de");
            user.setRole(Role.PLAYER);
            user.setFirstName(username);
            user.setLastName("lastname");
            user.setProfilPicture(null);
            user.setClan(clan.getName());
            userRepository.save(user);

            clan.getMembers().add(user);

            clanRepository.save(clan);

            // Create and assign a deck to the user
            Deck userDeck = createDeckForUser(username);
            user.setDecks(Collections.singletonList(userDeck));
            deckRepository.save(userDeck);
            userRepository.save(user);

            System.out.println("User " + username + " has been initialized with a deck.");
        } else {
            System.out.println("User " + username + " already exists.");
        }
    }

    private Deck createDeckForUser(String username) {
        Deck deck = new Deck();
        deck.setName(username + "'s Deck");

        List<Cards> commonCards = cardsRepository.findByCardRarity(Rarity.COMMON);
        List<Cards> legendaryCards = cardsRepository.findByCardRarity(Rarity.LEGENDARY);

        if (commonCards.size() < 3 || legendaryCards.isEmpty()) {
            throw new IllegalStateException("Not enough cards to create a deck.");
        }

        Collections.shuffle(commonCards);
        Cards card30 = cardsRepository.findById(30L).orElse(null);
        List<Cards> selectedCards = new ArrayList<>();
        selectedCards.addAll(commonCards.subList(0, 3)); // Add 3 common cards
        selectedCards.add(card30);

        deck.setCards(selectedCards);
        return deck;
    }
}