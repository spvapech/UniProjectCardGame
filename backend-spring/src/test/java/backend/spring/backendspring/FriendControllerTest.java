package backend.spring.backendspring;

import backend.spring.backendspring.Controller.FriendController;
import backend.spring.backendspring.Enum.FriendRequestStatus;
import backend.spring.backendspring.Model.FriendRequest;
import backend.spring.backendspring.Model.User;
import backend.spring.backendspring.Service.FriendService;
import backend.spring.backendspring.Service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

public class FriendControllerTest {

    @Mock
    private FriendService friendService;

    @Mock
    private UserService userService;

    @InjectMocks
    private FriendController friendController;

    @BeforeEach
    public void setup() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    public void testSendFriendRequest_Success() {
        Long requesterId = 1L;
        String recipientUsername = "recipient";
        User recipient = new User();
        recipient.setId(2L);

        when(userService.findByUsername(recipientUsername)).thenReturn(recipient);
        when(friendService.sendFriendRequest(requesterId, recipient.getId())).thenReturn(ResponseEntity.ok("Request sent"));

        ResponseEntity<String> response = friendController.sendFriendRequest(requesterId, recipientUsername);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("Request sent", response.getBody());
    }

    @Test
    public void testSendFriendRequest_UserNotFound() {
        Long requesterId = 1L;
        String recipientUsername = "unknown";

        when(userService.findByUsername(recipientUsername)).thenReturn(null);

        ResponseEntity<String> response = friendController.sendFriendRequest(requesterId, recipientUsername);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("User not found", response.getBody());
    }

    @Test
    public void testRespondToFriendRequest_Success() {
        Long requestId = 1L;
        FriendRequestStatus status = FriendRequestStatus.ACCEPTED;

        when(friendService.respondToFriendRequest(requestId, status)).thenReturn(ResponseEntity.ok("Request responded"));

        ResponseEntity<String> response = friendController.respondToFriendRequest(requestId, status);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("Request responded", response.getBody());
    }

    @Test
    public void testGetPendingRequests_Success() {
        Long userId = 1L;
        List<FriendRequest> friendRequests = new ArrayList<>();

        when(friendService.getPendingRequests(userId)).thenReturn(friendRequests);

        List<FriendRequest> response = friendController.getPendingRequests(userId);

        assertEquals(friendRequests, response);
    }

    @Test
    public void testGetFriends_Success() {
        Long userId = 1L;
        List<User> friends = new ArrayList<>();

        when(friendService.getFriends(userId)).thenReturn(friends);

        List<User> response = friendController.getFriends(userId);

        assertEquals(friends, response);
    }
}
