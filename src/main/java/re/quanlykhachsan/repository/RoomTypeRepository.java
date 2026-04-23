package re.quanlykhachsan.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import re.quanlykhachsan.entity.RoomType;
@Repository
public interface RoomTypeRepository extends JpaRepository<RoomType, Long> {

}
