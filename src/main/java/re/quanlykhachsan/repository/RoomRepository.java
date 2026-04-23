package re.quanlykhachsan.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import re.quanlykhachsan.entity.Room;

@Repository
public interface RoomRepository extends JpaRepository<Room,Long> {
}
