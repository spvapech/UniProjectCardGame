package backend.spring.backendspring.Repository;

import backend.spring.backendspring.Model.DuellMode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DuellModeRepository extends JpaRepository<DuellMode, Long> {
    Optional<DuellMode> findByUserIdAndEnemyId(Long userId, Long enemyId);
}
