package backend.spring.backendspring.Dtos;

import backend.spring.backendspring.Model.Cards;
import lombok.Data;

import java.util.List;

@Data
public class DuellResponseDTO {
    private Long duellId;
    private Long userId;
    private int userHp;
    private List<Cards> userCards; // Cards user has played
    private Long enemyId;
    private int enemyHp;
    private List<Cards> enemyCards; // Cards enemy has played
    private Long currentTurnUserId;
}
