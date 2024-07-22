package backend.spring.backendspring.Dtos;

import lombok.*;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class AdminDto {
    private String firstName;
    private String lastName;
    private String username;
    private String email;
    private String password;
    private LocalDate dateOfBirth;
}