    package backend.spring.backendspring.Dtos;

    import lombok.*;
    import org.springframework.web.multipart.MultipartFile;

    import java.time.LocalDate;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    @Getter
    @Setter
    public class RegistrationDto {
        private String firstName;
        private String lastName;
        private String email;
        private String username;
        private String password;
        private LocalDate dateOfBirth;
        private MultipartFile imageFile;
    }