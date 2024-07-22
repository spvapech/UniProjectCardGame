package backend.spring.backendspring.Repository;

import backend.spring.backendspring.Model.Clan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ClanRepository extends JpaRepository<Clan, Long> {
    Clan findByName(String name);
}
