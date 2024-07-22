package backend.spring.backendspring.Dtos;

import lombok.*;

@Data
@NoArgsConstructor
public class UserDto {
    private Long id;
    private String username;
    private String email;
    private String firstName;
    private String lastName;
    private byte[] profilPicture;

    public UserDto(Long id, String username, String email, String firstName, String lastName, byte[] profilPicture) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
        this.profilPicture = profilPicture;
    }
}
