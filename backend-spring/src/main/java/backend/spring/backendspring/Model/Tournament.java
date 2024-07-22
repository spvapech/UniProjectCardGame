package backend.spring.backendspring.Model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "tournaments")
public class Tournament {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToMany(fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @JoinColumn(name = "tournament_id")
    private List<Bet> listOfBets;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "tournament_users",
            joinColumns = @JoinColumn(name = "tournament_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    private List<User> participants;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "tournament_winners",
            joinColumns = @JoinColumn(name = "tournament_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    private List<User> winnersQueue;


    @ElementCollection
    private List<Long> completedPlayers = new ArrayList<>();


}
