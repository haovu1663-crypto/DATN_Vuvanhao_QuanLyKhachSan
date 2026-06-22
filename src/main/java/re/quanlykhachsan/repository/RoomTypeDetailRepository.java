package re.quanlykhachsan.repository;

import jakarta.persistence.Entity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import re.quanlykhachsan.entity.RoomTypeDetail;

import java.util.Optional;

@Repository
public interface RoomTypeDetailRepository extends JpaRepository<RoomTypeDetail, Long> {
    // Cách 3: Sử dụng JPQL tự viết (Nếu bạn muốn kiểm soát câu lệnh tường minh hoặc fetch join nếu cần)
    @Query("SELECT rtd FROM RoomTypeDetail rtd WHERE rtd.roomType.id = :roomTypeId")
    RoomTypeDetail findByRoomTypeIdCustom(@Param("roomTypeId") Long roomTypeId);
}