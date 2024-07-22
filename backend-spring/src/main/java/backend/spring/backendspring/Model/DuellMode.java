package backend.spring.backendspring.Model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonManagedReference;

import java.util.ArrayList;
import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
@Entity(name = "duell_mode")
public class DuellMode {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long duellId;

    private Long userId;
    private Long enemyId;

    private int userHp = 50;
    private int enemyHp = 50;

    @OneToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "duell_mode_user_field",
            joinColumns = @JoinColumn(name = "duell_mode_duell_id"),
            inverseJoinColumns = @JoinColumn(name = "user_field_card_id")
            // Entfernen der Unique Constraint
    )
    private List<Cards> userField = new ArrayList<>();

    @OneToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "duell_mode_enemy_field",
            joinColumns = @JoinColumn(name = "duell_mode_duell_id"),
            inverseJoinColumns = @JoinColumn(name = "enemy_field_card_id")
            // Entfernen der Unique Constraint
    )
    private List<Cards> enemyField = new ArrayList<>();

    @OneToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "duell_mode_user_dead_cards",
            joinColumns = @JoinColumn(name = "duell_mode_duell_id"),
            inverseJoinColumns = @JoinColumn(name = "user_dead_cards_card_id")
            // Entfernen der Unique Constraint
    )
    private List<Cards> userDeadCards = new ArrayList<>();

    @OneToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "duell_mode_enemy_dead_cards",
            joinColumns = @JoinColumn(name = "duell_mode_duell_id"),
            inverseJoinColumns = @JoinColumn(name = "enemy_dead_cards_card_id")
            // Entfernen der Unique Constraint
    )
    private List<Cards> enemyDeadCards = new ArrayList<>();

    private Long currentTurnUserId;  // New field to track whose turn it is
}
