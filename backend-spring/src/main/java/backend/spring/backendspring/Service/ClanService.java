package backend.spring.backendspring.Service;

import backend.spring.backendspring.Model.Clan;
import backend.spring.backendspring.Model.User;
import backend.spring.backendspring.Repository.ClanRepository;
import backend.spring.backendspring.Repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class ClanService {

    @Autowired
    private ClanRepository clanRepository;

    @Autowired
    private UserRepository userRepository;


    @Transactional
    public ResponseEntity<?> createClan(Long userId, String name){
        User user = userRepository.findById(userId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if(user.getClan()!=null){
            return ResponseEntity.badRequest().body("You already have a clan");
        }

        Clan clan= new Clan();
        clan.setName(name);
        clan.setOwner(user.getUsername());
        clan.getMembers().add(user);
        clanRepository.save(clan);
        user.setClan(name);
        userRepository.save(user);

        return ResponseEntity.status(HttpStatus.CREATED).body("Clan created successfully");
    }

    @Transactional
    public ResponseEntity<?> JoinClan(Long userId ,Long clanId){
        User user = userRepository.findById(userId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        Clan clan = clanRepository.findById(clanId).orElseThrow(() ->new ResponseStatusException(HttpStatus.NOT_FOUND, "Clan not found"));

        if(user.getClan()!=null){
            return ResponseEntity.badRequest().body("You already have a clan");
        }

        clan.getMembers().add(user);
        clanRepository.save(clan);
        user.setClan(clan.getName());
        userRepository.save(user);

        return ResponseEntity.status(HttpStatus.CREATED).body("You joined successfully");
    }

    public List<Clan> getAllClans() {
        return clanRepository.findAll();
    }

    @Transactional
    public ResponseEntity<?> leaveClan(Long userId,Long clanId){
        User user = userRepository.findById(userId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        Clan clan =clanRepository.findById(clanId).orElseThrow(() ->new ResponseStatusException(HttpStatus.NOT_FOUND, "Clan not found"));

        if (!clan.getMembers().contains(user)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("User is not a member of the clan");
        }

        user.setClan(null);
        userRepository.save(user);
        clan.getMembers().remove(user);
        clanRepository.save(clan);

        return ResponseEntity.status(HttpStatus.CREATED).body("You left successfully");
    }

    public ResponseEntity<?> getUserClan(Long userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (user.getClan() == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User does not belong to any clan");
        }

        Clan clan = clanRepository.findByName(user.getClan());
        if (clan == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Clan not found");
        }

        return ResponseEntity.ok(clan);

    }
    public List<User> getMembers(Long userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        Clan clan = clanRepository.findByName(user.getClan());
        return clan.getMembers();
    }
    public String getClanName(Long userId){
        User user = userRepository.findById(userId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        Clan clan = clanRepository.findByName(user.getClan());
        return clan.getName();
    }
}
