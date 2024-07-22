package backend.spring.backendspring.Service;

import backend.spring.backendspring.CSV.CardsCsvSample;
import backend.spring.backendspring.Model.Cards;
import backend.spring.backendspring.Model.Deck;
import backend.spring.backendspring.Repository.CardsRepository;
import backend.spring.backendspring.Repository.DeckRepository;
import com.opencsv.bean.CsvToBean;
import com.opencsv.bean.CsvToBeanBuilder;
import com.opencsv.bean.HeaderColumnNameMappingStrategy;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.Reader;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CardsService {

    private final CardsRepository cardsRepository;
    private final DeckRepository deckRepository;

    //Upload einer CSV-Datei wandelt diese in Cards-Objekte um
    public Integer uploadCards(MultipartFile file) throws IOException {
        Set<Cards> cards = watchCsv(file);
        cardsRepository.saveAll(cards);
        return cards.size();
    }

    //Löscht eine Karte anhand ihrer ID.
    public void deleteCardById(Long cardId) {
        List<Deck> decks = deckRepository.findAll();
        for (Deck deck : decks) {
            deck.getCards().removeIf(card -> card.getCardId().equals(cardId));
            deckRepository.save(deck);
        }
        cardsRepository.deleteById(cardId);
    }

    //Prüft ob die ID der Karte existiert
    public boolean existsById(Long cardId) {
        return cardsRepository.existsById(cardId);
    }

    //Ruft alle Karten aus der Datenbank ab.
    public List<Cards> getAllCards() {
        return cardsRepository.findAll();
    }

    private static Set<Cards> watchCsv(MultipartFile file) throws IOException {
        try (Reader reader = new InputStreamReader(file.getInputStream())) {
            //Spaltenüberschriften von CSV werden Objekt zugeordnet
            HeaderColumnNameMappingStrategy<CardsCsvSample> mapStrategy = new HeaderColumnNameMappingStrategy<>();
            mapStrategy.setType(CardsCsvSample.class);

            //Konvertierung von CSV-Daten in Objekte
            CsvToBean<CardsCsvSample> csvToBean = new CsvToBeanBuilder<CardsCsvSample>(reader)
                    .withMappingStrategy(mapStrategy)
                    .withIgnoreEmptyLine(true)
                    .withIgnoreLeadingWhiteSpace(true)
                    .build();

            return csvToBean.parse()
                    .stream()
                    .map(csvObject -> Cards.builder()
                            .cardId(csvObject.getId())
                            .cardName(csvObject.getName())
                            .cardRarity(csvObject.getRarity())
                            .cardAtkPoints(csvObject.getAtk())
                            .cardDefPoints(csvObject.getDef())
                            .cardDescr(csvObject.getDesc())
                            .cardPictureUrl(csvObject.getImgUrl())
                            .build()
                    )
                    .collect(Collectors.toSet());
        }
    }
}
