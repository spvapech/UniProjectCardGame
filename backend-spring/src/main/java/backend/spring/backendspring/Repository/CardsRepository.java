package backend.spring.backendspring.Repository;

import backend.spring.backendspring.Enum.Rarity;
import backend.spring.backendspring.Model.Cards;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CardsRepository extends JpaRepository<Cards, Long> {
    void deleteById(Long id);
    boolean existsById(Long id);
    List<Cards> findAllByCardRarity(Rarity rarity);

    List<Cards> findByCardRarity(Rarity rarity);
}
