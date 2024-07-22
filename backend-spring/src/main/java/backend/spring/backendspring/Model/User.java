package backend.spring.backendspring.Model;

import backend.spring.backendspring.Enum.UserStatus;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@NoArgsConstructor
@Getter
@Setter
@Entity
@Table(name = "users")
public class User {

    public User(String firstName, String lastName, String username, String password, String email, byte[] profilPicture, LocalDate date) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.username = username;
        this.password = password;
        this.email = email;
        this.profilPicture = profilPicture;
        this.role = Role.PLAYER;
        this.date = date;

    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column
    private String firstName;

    @Column
    private String lastName;

    @Column
    private String username;

    @Column
    private String password;

    @Column
    private String email;

    @Column
    private LocalDate date;

    @Column
    private int SEP_Coins;

    @Column
    public int rank;

    @Column
    private Role role;

    @Column
    private String clan;

    @Column
    private byte[] profilPicture;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "user_decks",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "deck_id")
    )
    @JsonManagedReference
    private List<Deck> decks = new ArrayList<>();

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "user_cards",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "card_id")
    )
    private List<Cards> cards = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    private UserStatus status;


    private boolean gameInvitation = false;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "user_friends",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "friend_id")
    )
    @JsonIgnore
    private List<User> friends = new ArrayList<>();

    private Long duellModeId;

    @ManyToOne
    @JoinColumn(name = "selected_deck_id")
    @JsonManagedReference
    private Deck selectedDeck;


    private Long tournamentId;

    private boolean tokenForLootbox = false;
}
