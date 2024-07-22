package backend.spring.backendspring.Controller;


import backend.spring.backendspring.Dtos.ClanDto;
import backend.spring.backendspring.Dtos.DeckDto;
import backend.spring.backendspring.Model.Cards;
import backend.spring.backendspring.Model.Clan;
import backend.spring.backendspring.Model.User;
import backend.spring.backendspring.Service.ClanService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/Clan")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class ClanController {

    private ClanService clanService;

    public ClanController(ClanService clanService) {
        this.clanService = clanService;
    }

    @PostMapping("/Create")
    public ResponseEntity<?> createClan( @RequestBody ClanDto clanDto,
                                         @CookieValue(value = "userId", required = false) Long userId) {
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("No user logged in");
        }
        return clanService.createClan(userId, clanDto.getClanName());
    }

    @PostMapping("/Join/{clanId}")
    public ResponseEntity<?> joinClan(@PathVariable Long clanId, @CookieValue(value = "userId", required = false) Long userId){
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("No user logged in");
        }
        return clanService.JoinClan(userId,clanId);
    }
    @PostMapping("/leave/{clanId}")
    public ResponseEntity<?> leaveClan(@PathVariable Long clanId, @CookieValue(value = "userId", required = false) Long userId) {
        {
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("No user logged in");
            }
            return clanService.leaveClan(userId,clanId);
        }
    }
    @GetMapping
    public List<Clan> getAllClans() {
        return clanService.getAllClans();
    }
    @GetMapping("/userClan")
    public ResponseEntity<?> getUserClan(@CookieValue(value = "userId", required = false) Long userId){
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("No user logged in");
        }
        return clanService.getUserClan(userId);
    }
    @GetMapping("/members")
    public List<User> getMembers(@CookieValue(value = "userId", required = false) Long userId){
        return clanService.getMembers(userId);
    }

    @GetMapping("/name")
    public String getName(@CookieValue(value = "userId", required = false) Long userId){
        return clanService.getClanName(userId);
    }
}

