package backend.spring.backendspring.Model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;

@AllArgsConstructor
@NoArgsConstructor
@Entity
@Data
@Getter
@Setter
@Table(name="images")
public class Image {

    @Id
    @GeneratedValue
    private int imageId;
    private String path;
    private String fileName;
}