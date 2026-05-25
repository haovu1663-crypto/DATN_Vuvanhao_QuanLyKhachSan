package re.quanlykhachsan.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import re.quanlykhachsan.entity.Room;
import re.quanlykhachsan.entity.StatusRoom;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {

    @Query("SELECT COUNT(r) > 0 FROM Room r WHERE r.roomType.id = :key")
    boolean existsByRoomTypeId(@Param("key") Long id);

    List<Room> findByStatus(StatusRoom status);

    // tìm kiếm phòng đã được đặt cọc theo email của khách
    @Query("SELECT b.room FROM Booking b " +
            "WHERE b.customer.email = :email " +
            "AND b.room.status = 'CURRENTLY_TENANT'")
    List<Room> findRoomsByCustomerEmail(@Param("email") String email);

    // tìm kiếm phòng đã checkIn theo email của khách
    @Query("SELECT b.room FROM Booking b " +
            "WHERE b.customer.email = :email " +
            "AND b.room.status = 'CHECKED'")
    List<Room> findRoomsByCustomerEmailchecIn(@Param("email") String email);

    // lấy room checked theo phonenumber
    @Query("SELECT r FROM Booking b JOIN b.room r " +
            "WHERE r.status = re.quanlykhachsan.entity.StatusRoom.CHECKED " +
            "AND b.phonenumber = :phoneNumber")
    List<Room> findCheckedRoomsByPhoneNumber(@Param("phoneNumber") String phoneNumber);

    // lấy ra phòng chưa được đặt trong khoảng ngày khách yêu cầu
    // dùng công thức overlap chuẩn: checkIn < b.enventCheckoutDate AND checkOut > b.enventCheckinDate
    @Query("""
        SELECT r FROM Room r
        WHERE r.roomType.capacity >= :capacity
        AND r.roomType.id = :roomTypeId
        AND LOWER(r.workBranch) LIKE LOWER(CONCAT('%', :workBranch, '%'))
        AND r.id NOT IN (
            SELECT b.room.id FROM Booking b
            WHERE b.room.id IS NOT NULL
            AND :checkIn  < b.enventCheckoutDate
            AND :checkOut > b.enventCheckinDate
        )
    """)
    List<Room> findAvailableRooms(
            @Param("workBranch") String workBranch,
            @Param("roomTypeId") Long roomTypeId,
            @Param("capacity")   int capacity,
            @Param("checkIn")    LocalDate checkIn,
            @Param("checkOut")   LocalDate checkOut
    );

    boolean existsByNameAndWorkBranch(String name, String workBranch);
}