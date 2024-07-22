package backend.spring.backendspring.Controller;

import backend.spring.backendspring.Enum.UserStatus;
import backend.spring.backendspring.Model.*;
import backend.spring.backendspring.Repository.*;
import jakarta.transaction.Transactional;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Controller
public class TournamentController {
    private final UserRepository userRepository;
    private final ClanRepository clanRepository;
    private final TournamentRepository tournamentRepository;
    private final DuellModeRepository duellModeRepository;
    private final BetRepository betRepository;
    private final AtomicInteger playerCount = new AtomicInteger(0);
    private final AtomicInteger respondedCount = new AtomicInteger(0);
    private List<User> invitedUserIds = new ArrayList<>();
    private List<User> acceptedUserIds = new ArrayList<>();

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public TournamentController(UserRepository userRepository, ClanRepository clanRepository, TournamentRepository tournamentRepository, DuellModeRepository duellModeRepository, BetRepository betRepository) {
        this.userRepository = userRepository;
        this.clanRepository = clanRepository;
        this.tournamentRepository = tournamentRepository;
        this.duellModeRepository = duellModeRepository;
        this.betRepository = betRepository;
    }

    @MessageMapping("/tournament/join")
    @SendTo("/topic/tournament/players")
    public int joinTournament() {
        return playerCount.incrementAndGet();
    }

    @MessageMapping("/tournament/leave")
    @SendTo("/topic/tournament/players")
    public int leaveTournament() {
        return playerCount.decrementAndGet();
    }

    @MessageMapping("/tournament/playerCount")
    @SendTo("/topic/tournament/playerCount")
    public int getPlayerCount() {
        return playerCount.get();
    }

    @MessageMapping("/clan/invite")
    @SendTo("/topic/invite/clan")
    public ResponseEntity<?> inviteClanMember(@Payload InvitePayload invitePayload) {
        User user = userRepository.findById(invitePayload.getUserId()).orElseThrow();
        Clan clan = clanRepository.findByName(user.getClan());
        List<User> clanMembers = clan.getMembers();

        invitedUserIds.clear();
        acceptedUserIds.clear();
        respondedCount.set(0);

        List<User> invitedUsers = new ArrayList<>();

        for (User clanMember : clanMembers) {
            if (clanMember.getStatus() == UserStatus.OFFLINE) {
                System.out.println("User " + clanMember.getUsername() + " is not online");
                continue;
            }
            if (clanMember.getStatus() == UserStatus.INGAME) {
                System.out.println("User " + clanMember.getUsername() + " is in a game");
                continue;
            }
            /*if (user.getDecks().size() < 1 || clanMember.getDecks().size() < 1) {
                System.out.println("User or enemy " + clanMember.getUsername() + " has no deck");
                continue;
            }*/

            if (clanMember.getStatus() == UserStatus.ONLINE) {
                clanMember.setGameInvitation(true); // Set game invitation flag
                user.setGameInvitation(true);
                userRepository.save(user);
                userRepository.save(clanMember);

                // Send the invitation to the clan member
                messagingTemplate.convertAndSend("/topic/invite/clan/" + clanMember.getId(), invitePayload);
                System.out.println("Game invitation sent to: " + clanMember.getUsername());
                invitedUsers.add(clanMember);
                invitedUserIds.add(clanMember);
            }
        }

        if (invitedUsers.isEmpty()) {
            return ResponseEntity.badRequest().body("No clan members available for invitation");
        }

        return ResponseEntity.ok("Invitations sent to clan members: " + invitedUsers.stream().map(User::getUsername).collect(Collectors.joining(", ")));
    }

    @MessageMapping("/clan/accept")
    @SendTo("/topic/clan/response")
    public void acceptInvite(@Payload InviteResponsePayload inviteResponsePayload) {
        User user = userRepository.findById(inviteResponsePayload.getUserId()).orElseThrow();
        Clan clan = clanRepository.findByName(user.getClan());

        respondedCount.incrementAndGet();
        if (inviteResponsePayload.isAccepted()) {
            acceptedUserIds.add(user);
        }

        if (acceptedUserIds.size() == clan.getMembers().size()) {
            startTournament();
        }

    }

    private void startTournament() {
        if (acceptedUserIds.isEmpty()) {
            playerCount.set(0);
            invitedUserIds.clear();
            acceptedUserIds.clear();
            respondedCount.set(0);
            return;
        }

        Tournament tournament = new Tournament();
        tournament.setParticipants(new ArrayList<>(acceptedUserIds));
        tournament.setWinnersQueue(new ArrayList<>(acceptedUserIds));

        // Shuffle the list to randomize matchups
        Collections.shuffle(acceptedUserIds);

        tournamentRepository.save(tournament);

        // Create matchups
        for (int i = 0; i < acceptedUserIds.size() - 1; i += 2) {
            User player1 = acceptedUserIds.get(i);
            User player2 = acceptedUserIds.get(i + 1);
            // Notify each player about their opponent
            InviteResponsePayload inviteResponsePayload = new InviteResponsePayload(tournament.getId(), player1.getId(), player2.getId());
            messagingTemplate.convertAndSend("/topic/tournament/start/bet/" + player1.getId(), inviteResponsePayload);
            messagingTemplate.convertAndSend("/topic/tournament/start/bet/" + player2.getId(), inviteResponsePayload);
        }
        /*// If there's an odd number of participants, the last player gets a bye
        if (acceptedUserIds.size() % 2 != 0) {
            User lastPlayer = acceptedUserIds.get(acceptedUserIds.size() - 1);
            matchups.add(lastPlayer.getUsername() + " gets a bye");
            messagingTemplate.convertAndSend("/topic/tournament/matchup/" + lastPlayer.getId(), "You get a bye this round");
        }*/

        // Reset for next tournament
        playerCount.set(0);
        invitedUserIds.clear();
        acceptedUserIds.clear();
        respondedCount.set(0);
    }

    @MessageMapping("/bet/place")
    @SendTo("/topic/bet/response")
    @Transactional
    public ResponseEntity<?> placeBet(@Payload BetPayload betPayload) {
        User user = userRepository.findById(betPayload.getUserId()).orElseThrow();
        Tournament tournament = tournamentRepository.findById(betPayload.tournamentId).orElseThrow();

        Bet bet = new Bet();
        bet.setUser(user);
        bet.setBet(betPayload.getBet());
        bet.setTournamentModeId(betPayload.getTournamentId());
        bet.setWinnerName(betPayload.getWinnerName());
        betRepository.save(bet);

        user.setSEP_Coins(user.getSEP_Coins() - betPayload.bet);
        userRepository.save(user);

        tournament.getListOfBets().add(bet);
        tournamentRepository.save(tournament);

        if (tournament.getListOfBets().size() == tournament.getParticipants().size()) {
            Collections.shuffle(tournament.getParticipants());


            // Notify all participants that bets are ready and they should transition to the game mode
            messagingTemplate.convertAndSend("/topic/tournament/start/bet/ready", true);

            for (int i = 0; i < tournament.getParticipants().size() - 1; i += 2) {
                User player1 = tournament.getParticipants().get(i);
                User player2 = tournament.getParticipants().get(i + 1);
                DuellMode duellMode = new DuellMode();
                duellMode.setUserId(player1.getId());
                duellMode.setEnemyId(player2.getId());
                duellMode.setEnemyField(null);
                duellMode.setUserField(null);
                duellMode.setCurrentTurnUserId(determineFirstTurnUserId(player1.getId(), player2.getId()));

                // Save DuellMode to generate duellId
                duellModeRepository.save(duellMode);

                // Set duellId to players
                player1.setDuellModeId(duellMode.getDuellId());
                player2.setDuellModeId(duellMode.getDuellId());
                player1.setTournamentId(tournament.getId());
                player2.setTournamentId(tournament.getId());

                // Save players with updated duellId
                userRepository.save(player1);
                userRepository.save(player2);

                System.out.println("Duellanten: " + player1.getId() + " VS " + player2.getId());

            }
        }
        playerCount.set(0);
        invitedUserIds.clear();
        acceptedUserIds.clear();
        respondedCount.set(0);

        return ResponseEntity.ok("Bet placed successfully");
    }

    @MessageMapping("/tournament/info")
    @SendTo("/topic/tournament/information")
    @Transactional
    public void getTournamentInfo(@Payload Long userId) {
        User user = userRepository.findById(userId).orElseThrow();
        Tournament tournament = tournamentRepository.findById(user.getTournamentId()).orElseThrow();

        TournamentInfoPayload tournamentInfoPayload = new TournamentInfoPayload(tournament.getId(), tournament.getParticipants(), tournament.getWinnersQueue());

        System.out.println("Sending TournamentInfoPayload: " + tournamentInfoPayload);

        messagingTemplate.convertAndSend("/topic/tournament/information/" + userId, tournamentInfoPayload);
    }


    @MessageMapping("/tournament/next-round")
    @SendTo("/topic/tournament/next-round")
    @Transactional
    public void handleNextRound(@Payload TournamentEndGamePayload payload) {
        // Debugging line
        System.out.println("handleNextRound called with payload: " + payload);

        // Handle the end of the current round
        Tournament tournament = tournamentRepository.findById(payload.getTournamentId()).orElseThrow();

        // Update winners queue by removing the loser
        User loser = userRepository.findById(payload.getLoser()).orElseThrow();

        if (tournament.getWinnersQueue().contains(loser)) {
            tournament.getWinnersQueue().remove(loser);
        }

        // Check if only one participant remains
        if (tournament.getWinnersQueue().size() == 1) {
            User winner = tournament.getWinnersQueue().get(0);
            winner.setSEP_Coins(winner.getSEP_Coins() + 700);
            userRepository.save(winner);
            // Delay the message sending by 1 second
            ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);
            scheduler.schedule(() -> {
                messagingTemplate.convertAndSend("/topic/tournament/winner/" + winner.getId(), true);
            }, 1, TimeUnit.SECONDS);


            betAuswertung(tournament);
        } else {
            // Update completed players list
            tournament.getCompletedPlayers().add(payload.getUserId());

            // Check if half of the participants have completed their matches
            if (tournament.getCompletedPlayers().size() >= tournament.getParticipants().size() / 2) {
                // Prepare for the next round with the winners
                ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);
                scheduler.schedule(() -> {
                    messagingTemplate.convertAndSend("/topic/tournament/start/bet/ready", true);
                }, 2, TimeUnit.SECONDS);
                List<User> updatedParticipants = new ArrayList<>(tournament.getWinnersQueue());
                tournament.getParticipants().clear();
                tournament.getParticipants().addAll(updatedParticipants);
                tournament.getCompletedPlayers().clear(); // Clear the completed players list for the next round

                // Check if the number of participants is odd and handle accordingly
                if (tournament.getParticipants().size() % 2 != 0) {
                    User luckyUser = tournament.getParticipants().get((int) (Math.random() * tournament.getParticipants().size()));
                    tournament.getParticipants().remove(luckyUser);  // Remove lucky user from participants
                    tournament.getWinnersQueue().add(luckyUser);  // Add lucky user to winnersQueue
                }


                // Create new matchups for the next round
                Collections.shuffle(tournament.getParticipants());
                for (int i = 0; i < tournament.getParticipants().size() - 1; i += 2) {
                    User player1 = tournament.getParticipants().get(i);
                    User player2 = tournament.getParticipants().get(i + 1);

                    DuellMode duellMode = new DuellMode();
                    duellMode.setUserId(player1.getId());
                    duellMode.setEnemyId(player2.getId());
                    duellMode.setEnemyField(null);
                    duellMode.setUserField(null);
                    duellMode.setCurrentTurnUserId(determineFirstTurnUserId(player1.getId(), player2.getId()));

                    duellModeRepository.save(duellMode);

                    player1.setDuellModeId(duellMode.getDuellId());
                    player2.setDuellModeId(duellMode.getDuellId());
                    player1.setTournamentId(tournament.getId());
                    player2.setTournamentId(tournament.getId());

                    userRepository.save(player1);
                    userRepository.save(player2);


                    messagingTemplate.convertAndSend("/topic/tournament/start/duel/" + player1.getId(), duellMode);
                    messagingTemplate.convertAndSend("/topic/tournament/start/duel/" + player2.getId(), duellMode);
                }
            }
        }

        // Save the updated tournament
        tournamentRepository.save(tournament);
    }

    public void betAuswertung(Tournament tournament) {
        User winner = tournament.getWinnersQueue().get(0);
        List<Bet> bets = tournament.getListOfBets();


        for (Bet bet : bets) {
            User bettingUser = bet.getUser();
            if (bet.getWinnerName().equals(winner.getUsername())) {
                bettingUser.setSEP_Coins(bettingUser.getSEP_Coins() + bet.getBet());
                bettingUser.setTokenForLootbox(true);
                userRepository.save(bettingUser);
                ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);
                scheduler.schedule(() -> {
                    messagingTemplate.convertAndSend("/topic/tournament/betwinner/" + bettingUser.getId(), true);
                }, 10, TimeUnit.SECONDS);
            }
        }


    }



    private Long determineFirstTurnUserId(Long userId, Long enemyId) {
        Long firstTurnUserId = Math.random() < 0.5 ? userId : enemyId;
        System.out.println("Determined first turn user ID: " + firstTurnUserId);
        return firstTurnUserId;
    }


    @Data
    public static class TournamentEndGamePayload {
        private Long duellId;
        private Long userId;
        private Long enemyId;
        private Long loser;
        private Long tournamentId;
    }

    @Data
    public static class InvitePayload {
        private Long userId;
    }

    @Data
    public static class InviteResponsePayload {
        private Long tournamentId;
        private Long duellId;
        private Long userId;
        private Long enemyId;
        private boolean accepted;

        public InviteResponsePayload(Long tournamentId, Long player1Id, Long player2Id) {
            this.tournamentId = tournamentId;
            this.accepted = true;
            this.userId = player1Id;
            this.enemyId = player2Id;
        }
    }
    @Data
    public static class BetPayload {
        private Long userId;
        private int bet;
        private Long tournamentId;
        private String winnerName;
    }

    @Data
    public static class TournamentInfoPayload {
        private Long tournamentId;
        private List<User> acceptedUserIds;
        private List<User> winnersQueue;

        public TournamentInfoPayload(Long tournamentId, List<User> acceptedUserIds, List<User> winnersQueue) {
            this.tournamentId = tournamentId;
            this.acceptedUserIds = acceptedUserIds;
            this.winnersQueue = winnersQueue;
        }
    }
}
