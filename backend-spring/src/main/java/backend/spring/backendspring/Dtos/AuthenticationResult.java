package backend.spring.backendspring.Dtos;

import backend.spring.backendspring.Model.Role;
import lombok.*;

@Data
@AllArgsConstructor
public class AuthenticationResult {
    private boolean success;
    private Long userId;
    private String username;
    private Role role;
}
