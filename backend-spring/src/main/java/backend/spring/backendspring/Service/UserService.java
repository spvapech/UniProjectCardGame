package backend.spring.backendspring.Service;

import backend.spring.backendspring.Dtos.*;
import backend.spring.backendspring.Enum.UserStatus;
import backend.spring.backendspring.Model.DuellMode;
import backend.spring.backendspring.Model.Role;
import backend.spring.backendspring.Model.User;
import backend.spring.backendspring.Repository.DuellModeRepository;
import backend.spring.backendspring.Repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final DuellModeRepository duellModeRepository;

    public UserService(UserRepository userRepository, DuellModeRepository duellModeRepository) {
        this.userRepository = userRepository;
        this.duellModeRepository = duellModeRepository;
    }

    public ResponseEntity<String> registerUser(RegistrationDto userDto, MultipartFile imageFile) throws IOException {
        User existingUser = userRepository.findByUsername(userDto.getUsername());
        if (existingUser != null) {
            return ResponseEntity.badRequest().body("Username already in use..");
        }

        User player = new User();
        player.setUsername(userDto.getUsername());
        player.setEmail(userDto.getEmail());
        player.setPassword(userDto.getPassword());
        player.setRole(Role.PLAYER);
        player.setFirstName(userDto.getFirstName());
        player.setLastName(userDto.getLastName());
        player.setDate(userDto.getDateOfBirth());
        player.setRank(0);
        player.setSEP_Coins(500);
        player.setStatus(UserStatus.OFFLINE);

        if (imageFile != null && !imageFile.isEmpty()) {
            player.setProfilPicture(imageFile.getBytes());
        }

        userRepository.save(player);
        return ResponseEntity.ok().body("Registration successful!");
    }

    public ResponseEntity<String> registerAdmin(AdminDto adminDto) {
        User existingUser = userRepository.findByUsername(adminDto.getUsername());
        if (existingUser != null) {
            return ResponseEntity.badRequest().body("Email already in use..");
        }

        User admin = new User();
        admin.setFirstName(adminDto.getFirstName());
        admin.setLastName(adminDto.getLastName());
        admin.setEmail(adminDto.getEmail());
        admin.setPassword(adminDto.getPassword());
        admin.setRole(Role.ADMIN);
        admin.setUsername(adminDto.getUsername());
        admin.setSEP_Coins(500);
        admin.setRank(0);
        admin.setDate(adminDto.getDateOfBirth());
        admin.setStatus(UserStatus.OFFLINE);

        userRepository.save(admin);
        return ResponseEntity.ok().body("Admin-Registration successful!");
    }

    public List<User> getAllRegistered() {
        return userRepository.findAll();
    }

    public void deleteAll() {
        userRepository.deleteAll();
    }

    public ResponseEntity<AuthenticationResult> login(LoginDto loginDto) {
        User user = userRepository.findByUsername(loginDto.getUsername());
        if (user == null || !loginDto.getPassword().equals(user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new AuthenticationResult(false, null, null, null));
        }

        AuthenticationResult result = new AuthenticationResult(true, user.getId(), user.getUsername(), user.getRole());
        return ResponseEntity.ok(result);
    }

    public ResponseEntity<?> getUserDetails(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        String base64Image = user.getProfilPicture() != null ? Base64.getEncoder().encodeToString(user.getProfilPicture()) : null;

        Map<String, Object> userDetails = new HashMap<>();
        userDetails.put("id", user.getId());
        userDetails.put("firstName", user.getFirstName());
        userDetails.put("lastName", user.getLastName());
        userDetails.put("username", user.getUsername());
        userDetails.put("email", user.getEmail());
        userDetails.put("SEP_Coins", user.getSEP_Coins());
        userDetails.put("rank", user.getRank());
        userDetails.put("profilPicture", base64Image);
        userDetails.put("date", user.getDate());
        userDetails.put("clan", user.getClan());

        return ResponseEntity.ok(userDetails);
    }
    public User getUserId(Long id) {
        return userRepository.findById(id).orElse(null);
    }

    public void updateUserStatus(Long userId, UserStatus status) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        user.setStatus(status);
        userRepository.save(user);
    }

    public List<User> getOnlineUser() {
        return userRepository.findAll().stream()
                .filter(user -> user.getStatus() == UserStatus.ONLINE)
                .collect(Collectors.toList());
    }


    public User findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public ResponseEntity<?> getDuellForUser (Long userId) {
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User ID is missing from the request.");
        }

        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("User not found.");
        }

        Long duellId = user.getDuellModeId();
        if (duellId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Duel mode ID not found for user.");
        }

        DuellMode duellMode = duellModeRepository.findById(duellId).orElse(null);
        if (duellMode == null) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Duel mode not found.");
        }
        return ResponseEntity.ok(duellMode);
    }

    public ResponseEntity<DuellResponseDTO> getDuell(Long userId) {
        User user = userRepository.findById(userId).orElseThrow();

        DuellMode duellMode = duellModeRepository.findById(user.getDuellModeId()).orElseThrow();

        DuellResponseDTO responseDTO = new DuellResponseDTO();
        responseDTO.setDuellId(duellMode.getDuellId());
        responseDTO.setUserId(duellMode.getUserId());
        responseDTO.setUserHp(duellMode.getUserHp());
        responseDTO.setUserCards(duellMode.getUserField());
        responseDTO.setEnemyId(duellMode.getEnemyId());
        responseDTO.setEnemyHp(duellMode.getEnemyHp());
        responseDTO.setEnemyCards(duellMode.getEnemyField());
        responseDTO.setCurrentTurnUserId(duellMode.getCurrentTurnUserId());

        return ResponseEntity.ok(responseDTO);
    }
}