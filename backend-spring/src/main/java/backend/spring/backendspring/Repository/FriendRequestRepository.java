package backend.spring.backendspring.Repository;

import backend.spring.backendspring.Model.FriendRequest;
import backend.spring.backendspring.Model.User;
import backend.spring.backendspring.Enum.FriendRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FriendRequestRepository extends JpaRepository<FriendRequest, Long> {
    List<FriendRequest> findByRequesterAndStatus(User requester, FriendRequestStatus status);
    List<FriendRequest> findByRecipientAndStatus(User recipient, FriendRequestStatus status);
    Optional<FriendRequest> findByRequesterAndRecipientAndStatus(User requester, User recipient, FriendRequestStatus status);
}