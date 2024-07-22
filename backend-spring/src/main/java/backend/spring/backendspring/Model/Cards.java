package backend.spring.backendspring.Model;

import backend.spring.backendspring.Enum.Rarity;
import jakarta.persistence.*;
import lombok.*;

@AllArgsConstructor
@NoArgsConstructor
@Builder
@Data
@Entity
@Table(name = "cards")
public class Cards {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long cardId;

    @Column(name = "card_name", nullable = false)
    private String cardName;

    @Enumerated(EnumType.STRING)
    @Column(name = "card_rarity", nullable = false)
    private Rarity cardRarity;

    @Column(name = "attack_points", nullable = false)
    private Integer cardAtkPoints;

    @Column(name = "defence_points", nullable = false)
    private Integer cardDefPoints;

    @Column(name = "card_description", nullable = false)
    private String cardDescr;

    @Column(name = "card_picture", nullable = false)
    private String cardPictureUrl;

    @Transient
    private int count;

    private boolean newlyPlaced;

    public boolean isNewlyPlaced() {
        return newlyPlaced;
    }

    public void setNewlyPlaced(boolean newlyPlaced) {
        this.newlyPlaced = newlyPlaced;
    }
}
