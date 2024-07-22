package backend.spring.backendspring.Dtos;

import backend.spring.backendspring.Model.Cards;
import lombok.*;

import java.util.List;


@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Getter
@Setter
public class DeckDto {
        private String deckName;
        private List<Cards> cards;
}