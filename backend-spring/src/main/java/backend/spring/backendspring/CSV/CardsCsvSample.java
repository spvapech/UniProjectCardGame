package backend.spring.backendspring.CSV;

import com.opencsv.bean.CsvBindByName;
import lombok.*;
import backend.spring.backendspring.Enum.Rarity;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CardsCsvSample {

    @CsvBindByName(column = "id")
    private Long id;

    @CsvBindByName(column = "card_name")
    private String name;

    @CsvBindByName(column = "card_rarity")
    private Rarity rarity;

    @CsvBindByName(column = "card_atk_points")
    private Integer atk;

    @CsvBindByName(column = "defence_points")
    private Integer def;

    @CsvBindByName(column = "card_description")
    private String desc;

    @CsvBindByName(column = "card_picture")
    private String imgUrl;
}
