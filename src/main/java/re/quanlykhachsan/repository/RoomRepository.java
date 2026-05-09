package re.quanlykhachsan.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import re.quanlykhachsan.dto.response.RoomRespone;
import re.quanlykhachsan.entity.Room;
import re.quanlykhachsan.entity.StatusRoom;
import re.quanlykhachsan.exception.ResourceNotFoundException;

import java.util.List;

@Repository
public interface RoomRepository extends JpaRepository<Room,Long> {
    @Query("SELECT COUNT(r) > 0 FROM Room r WHERE r.roomType.id = :key")
    boolean existsByRoomTypeId(@Param("key") Long id);
    List<Room> findByStatus(StatusRoom status);

    // tìm kiếm phòng đã được đặt cọc theo email của khác
    @Query("SELECT b.room FROM Booking b " +
            "WHERE b.customer.email = :email " +
            "AND b.room.status = 'CURRENTLY_TENANT'")
    List<Room> findRoomsByCustomerEmail(@Param("email") String email);
    // tìm kiếm phòng đã checIn theo email của khách
    @Query("SELECT b.room FROM Booking b " +
            "WHERE b.customer.email = :email " +
            "AND b.room.status = 'CHECKED'")
    List<Room> findRoomsByCustomerEmailchecIn(@Param("email") String email);
}
