package backend.spring.backendspring.Controller;

import backend.spring.backendspring.Dtos.*;
import backend.spring.backendspring.Model.User;
import backend.spring.backendspring.Service.UserService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/api/register")
    public ResponseEntity<String> register(@ModelAttribute RegistrationDto user, @RequestParam(value = "imageFile", required = false) MultipartFile imageFile) throws IOException {
        System.out.println(user);
        return userService.registerUser(user, imageFile);
    }

    @PostMapping("/api/register/admin")
    public ResponseEntity<String> registerAdmin(@RequestBody AdminDto adminDto) {
        System.out.println(adminDto);
        return userService.registerAdmin(adminDto);
    }

    @PostMapping("/api/login")
    public ResponseEntity<?> login(@RequestBody LoginDto loginDto, HttpServletResponse response) {
        AuthenticationResult result = userService.login(loginDto).getBody();

        assert result != null;
        if (result.isSuccess()) {
            Cookie cookie = new Cookie("userId", result.getUserId().toString());
            cookie.setPath("/");
            cookie.setHttpOnly(true);
            response.addCookie(cookie);
            return ResponseEntity.ok(result);
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Login failed");
        }
    }

    @GetMapping("/api/user/details")
    public ResponseEntity<?> getUserDetails(@CookieValue(value = "userId", required = false) Long userId) {
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Not logged in");
        }
        return userService.getUserDetails(userId);
    }

    @GetMapping("/details/friend/{friendId}")
    public ResponseEntity<?> getUserDetailsOfFriend(@PathVariable Long friendId) {
        return userService.getUserDetails(friendId);
    }

    @GetMapping("/api/getAll")
    public List<User> getAllRegistered() {
        return userService.getAllRegistered();
    }

    @GetMapping("/api/getUser/{id}")
    public User getUser(@PathVariable Long id) {
        return userService.getUserId(id);
    }

    @DeleteMapping("/api/deleteAll")
    public void deleteAll() {
        userService.deleteAll();
    }

    @GetMapping("/api/online-users")
    public List<User> getOnlineUser() {
        return userService.getOnlineUser();
    }

    @GetMapping("/api/getDuell")
    public ResponseEntity<DuellResponseDTO> getDuell(@RequestParam Long userId) {

        return userService.getDuell(userId);
    }
}
