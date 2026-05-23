package re.quanlykhachsan.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import re.quanlykhachsan.dto.response.RoomRespone;
import re.quanlykhachsan.entity.Room;
import re.quanlykhachsan.entity.StatusRoom;
import re.quanlykhachsan.exception.ResourceNotFoundException;

import java.time.LocalDate;
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
    // lấy room checked theo phonenumber
    @Query("SELECT r FROM Booking b JOIN b.room r " +
            "WHERE r.status = re.quanlykhachsan.entity.StatusRoom.CHECKED " +
            "AND b.phonenumber = :phoneNumber")
    List<Room> findCheckedRoomsByPhoneNumber(@Param("phoneNumber") String phoneNumber);

    // hiển thi room khi khach hàng booking theo ngày tháng
    @Query("""
        SELECT r FROM Room r 
        WHERE LOWER(r.workBranch) LIKE LOWER(CONCAT('%', :workBranch, '%'))
        AND r.roomType.id = :roomTypeId 
        AND r.roomType.capacity >= :capacity 
        AND r.id NOT IN (
            SELECT b.room.id FROM Booking b 
            WHERE b.room.id IS NOT NULL 
            AND (:checkIn BETWEEN b.enventCheckinDate AND b.enventCheckoutDate 
                 OR :checkOut BETWEEN b.enventCheckinDate AND b.enventCheckoutDate 
                 OR b.enventCheckinDate BETWEEN :checkIn AND :checkOut)
        )
    """)
    List<Room> findAvailableRooms(
            @Param("workBranch") String workBranch,
            @Param("roomTypeId") Long roomTypeId,
            @Param("capacity") int capacity,
            @Param("checkIn") LocalDate checkIn,
            @Param("checkOut") LocalDate checkOut
    );

    boolean existsByNameAndWorkBranch(String name, String workBranch);
}
