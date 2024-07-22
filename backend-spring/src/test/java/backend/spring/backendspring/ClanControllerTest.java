package backend.spring.backendspring;

import backend.spring.backendspring.Controller.ClanController;
import backend.spring.backendspring.Dtos.ClanDto;
import backend.spring.backendspring.Model.Clan;
import backend.spring.backendspring.Model.User;
import backend.spring.backendspring.Service.ClanService;
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

public class ClanControllerTest {

    @Mock
    private ClanService clanService;

    @InjectMocks
    private ClanController clanController;

    @BeforeEach
    public void setup() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    public void testCreateClan_Success() {
        Long userId = 1L;
        ClanDto clanDto = new ClanDto();
        clanDto.setClanName("TestClan");

        ResponseEntity<String> expectedResponse = ResponseEntity.status(HttpStatus.CREATED).body("Clan created successfully");
        when(clanService.createClan(userId, clanDto.getClanName())).thenReturn((ResponseEntity) expectedResponse);

        ResponseEntity<?> response = clanController.createClan(clanDto, userId);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertEquals("Clan created successfully", response.getBody());
    }

    @Test
    public void testCreateClan_NoUserLoggedIn() {
        ClanDto clanDto = new ClanDto();
        clanDto.setClanName("TestClan");

        ResponseEntity<?> response = clanController.createClan(clanDto, null);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertEquals("No user logged in", response.getBody());
    }

    @Test
    public void testJoinClan_Success() {
        Long userId = 1L;
        Long clanId = 1L;

        ResponseEntity<String> expectedResponse = ResponseEntity.ok("Joined clan successfully");
        when(clanService.JoinClan(userId, clanId)).thenReturn((ResponseEntity) expectedResponse);

        ResponseEntity<?> response = clanController.joinClan(clanId, userId);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("Joined clan successfully", response.getBody());
    }

    @Test
    public void testJoinClan_NoUserLoggedIn() {
        Long clanId = 1L;

        ResponseEntity<?> response = clanController.joinClan(clanId, null);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertEquals("No user logged in", response.getBody());
    }

    @Test
    public void testLeaveClan_Success() {
        Long userId = 1L;
        Long clanId = 1L;

        ResponseEntity<String> expectedResponse = ResponseEntity.ok("Left clan successfully");
        when(clanService.leaveClan(userId, clanId)).thenReturn((ResponseEntity) expectedResponse);

        ResponseEntity<?> response = clanController.leaveClan(clanId, userId);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("Left clan successfully", response.getBody());
    }

    @Test
    public void testLeaveClan_NoUserLoggedIn() {
        Long clanId = 1L;

        ResponseEntity<?> response = clanController.leaveClan(clanId, null);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertEquals("No user logged in", response.getBody());
    }

    @Test
    public void testGetAllClans() {
        List<Clan> clans = new ArrayList<>();
        when(clanService.getAllClans()).thenReturn(clans);

        List<Clan> response = clanController.getAllClans();

        assertEquals(clans, response);
    }

    @Test
    public void testGetUserClan_Success() {
        Long userId = 1L;

        ResponseEntity<String> expectedResponse = ResponseEntity.ok("User's clan");
        when(clanService.getUserClan(userId)).thenReturn((ResponseEntity) expectedResponse);

        ResponseEntity<?> response = clanController.getUserClan(userId);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("User's clan", response.getBody());
    }

    @Test
    public void testGetUserClan_NoUserLoggedIn() {
        ResponseEntity<?> response = clanController.getUserClan(null);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertEquals("No user logged in", response.getBody());
    }

    @Test
    public void testGetMembers() {
        Long userId = 1L;
        List<User> members = new ArrayList<>();
        when(clanService.getMembers(userId)).thenReturn(members);

        List<User> response = clanController.getMembers(userId);

        assertEquals(members, response);
    }

    @Test
    public void testGetName() {
        Long userId = 1L;
        String clanName = "TestClan";
        when(clanService.getClanName(userId)).thenReturn(clanName);

        String response = clanController.getName(userId);

        assertEquals(clanName, response);
    }
}
