package backend.spring.backendspring.Service;

import backend.spring.backendspring.Model.FriendRequest;
import backend.spring.backendspring.Enum.FriendRequestStatus;
import backend.spring.backendspring.Model.User;
import backend.spring.backendspring.Repository.FriendRequestRepository;
import backend.spring.backendspring.Repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static backend.spring.backendspring.Model.Role.ADMIN;

@Service
public class FriendService {
    private final FriendRequestRepository friendRequestRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final UserService userService;

    public FriendService(FriendRequestRepository friendRequestRepository, UserRepository userRepository, EmailService emailService, UserService userService) {
        this.friendRequestRepository = friendRequestRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.userService = userService;
    }

    public ResponseEntity<String> sendFriendRequest(Long requesterId, Long recipientId) {
        User requester = userRepository.findById(requesterId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Requester not found"));

        User recipient = userRepository.findById(recipientId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Recipient not found"));

        if (friendRequestRepository.findByRequesterAndRecipientAndStatus(requester, recipient, FriendRequestStatus.PENDING).isPresent()) {
            return ResponseEntity.badRequest().body("Friend request already sent.");
        }

        FriendRequest friendRequest = new FriendRequest(requester, recipient, FriendRequestStatus.PENDING);
        friendRequestRepository.save(friendRequest);

        // E-Mail-Benachrichtigung senden
        String subject = "Neue Freundschaftsanfrage";
        String text = "Hallo " + recipient.getUsername() + ",\n\n" +
                "Sie haben eine neue Freundschaftsanfrage von " + requester.getUsername() + ".";
        emailService.sendEmail(recipient.getEmail(), subject, text);

        return ResponseEntity.ok("Friend request sent!");
    }

    public ResponseEntity<String> respondToFriendRequest(Long requestId, FriendRequestStatus status) {
        FriendRequest friendRequest = friendRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Friend request not found"));

        if (status == FriendRequestStatus.ACCEPTED) {
            User requester = friendRequest.getRequester();
            User recipient = friendRequest.getRecipient();

            requester.getFriends().add(recipient);
            recipient.getFriends().add(requester);

            userRepository.save(requester);
            userRepository.save(recipient);
        }

        friendRequest.setStatus(status);
        friendRequestRepository.save(friendRequest);

        return ResponseEntity.ok("Friend request " + status.name().toLowerCase() + "!");
    }


    public List<FriendRequest> getPendingRequests(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        return friendRequestRepository.findByRecipientAndStatus(user, FriendRequestStatus.PENDING);
    }

    public List<User> getFriends(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        return user.getFriends();
    }

}