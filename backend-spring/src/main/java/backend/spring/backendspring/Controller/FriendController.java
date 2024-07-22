package backend.spring.backendspring.Controller;

import backend.spring.backendspring.Model.FriendRequest;
import backend.spring.backendspring.Enum.FriendRequestStatus;
import backend.spring.backendspring.Model.User;
import backend.spring.backendspring.Service.FriendService;
import backend.spring.backendspring.Service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/friends")
@CrossOrigin(origins = "http://localhost:3000/", allowCredentials = "true")
public class FriendController {

    private final FriendService friendService;
    private final UserService userService;

    public FriendController(FriendService friendService, UserService userService) {
        this.friendService = friendService;
        this.userService = userService;
    }

    @PostMapping("/sendRequest")
    public ResponseEntity<String> sendFriendRequest(@RequestParam Long requesterId, @RequestParam String recipientUsername) {
        User recipient = userService.findByUsername(recipientUsername);
        if (recipient == null) {
            return ResponseEntity.badRequest().body("User not found");
        }
        return friendService.sendFriendRequest(requesterId, recipient.getId());
    }

    @PostMapping("/respondRequest")
    public ResponseEntity<String> respondToFriendRequest(@RequestParam Long requestId, @RequestParam FriendRequestStatus status) {
        return friendService.respondToFriendRequest(requestId, status);
    }

    @GetMapping("/pendingRequests")
    public List<FriendRequest> getPendingRequests(@RequestParam Long userId) {
        return friendService.getPendingRequests(userId);
    }

    @GetMapping
    public List<User> getFriends(@RequestParam Long userId) {
        return friendService.getFriends(userId);
    }
}