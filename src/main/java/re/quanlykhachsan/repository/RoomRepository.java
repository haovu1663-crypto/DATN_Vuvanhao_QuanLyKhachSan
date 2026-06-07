package re.quanlykhachsan.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import re.quanlykhachsan.entity.Room;
import re.quanlykhachsan.entity.StatusBooking;
import re.quanlykhachsan.entity.StatusRoom;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {

    @Query("SELECT COUNT(r) > 0 FROM Room r WHERE r.roomType.id = :key AND r.active = true")
    boolean existsByRoomTypeId(@Param("key") Long id);

    @Query("SELECT r FROM Room r WHERE r.status = :status AND r.active = true")
    List<Room> findByStatus(@Param("status") StatusRoom status);

    // tìm kiếm phòng đã được đặt cọc theo email của khách
    @Query("SELECT b.room FROM Booking b " +
            "WHERE b.customer.email = :email " +
            "AND b.room.status = 'CURRENTLY_TENANT' " +
            "AND b.room.active = true")
    List<Room> findRoomsByCustomerEmail(@Param("email") String email);

    // tìm kiếm phòng đã checkIn theo email của khách
    @Query("SELECT b.room FROM Booking b " +
            "WHERE b.customer.email = :email " +
            "AND b.room.status = 'CHECKED' " +
            "AND b.room.active = true")
    List<Room> findRoomsByCustomerEmailchecIn(@Param("email") String email);

    // lấy room checked theo phonenumber
    @Query("SELECT r FROM Booking b JOIN b.room r " +
            "WHERE r.status = re.quanlykhachsan.entity.StatusRoom.CHECKED " +
            "AND r.active = true " +
            "AND b.phonenumber = :phoneNumber")
    List<Room> findCheckedRoomsByPhoneNumber(@Param("phoneNumber") String phoneNumber);

    // lấy ra phòng chưa được đặt trong khoảng ngày khách yêu cầu
    // dùng công thức overlap chuẩn: checkIn < b.enventCheckoutDate AND checkOut > b.enventCheckinDate
    @Query(value = """
    SELECT r.* FROM room r
    WHERE r.room_type_id = :roomTypeId
    AND r.work_branch = :workBranch
    AND r.active = true
    AND r.id NOT IN (
        SELECT b.room_id FROM booking b
        WHERE b.room_id IS NOT NULL
        AND b.status_booking NOT IN ('CANCELLED')
        AND :checkIn < CASE 
            WHEN b.status_booking = 'CHECKED_OUT' AND b.check_out_date IS NOT NULL 
                THEN DATE(b.check_out_date)
            ELSE b.envent_checkout_date
        END
        AND :checkOut > b.envent_checkin_date
    )
""", nativeQuery = true)
    List<Room> findAvailableRooms(
            @Param("workBranch") String workBranch,
            @Param("roomTypeId") Long roomTypeId,
            @Param("checkIn")    LocalDate checkIn,
            @Param("checkOut")   LocalDate checkOut
    );
    // lấy ra phong với ngày thánh chưa checkin và đúng chi nhanh tuyệt đối
    // lấy ra phòng chưa được đặt trong khoảng ngày khách yêu cầu
    // dùng công thức overlap chuẩn: checkIn < b.enventCheckoutDate AND checkOut > b.enventCheckinDate
    @Query("""
    SELECT r FROM Room r
    WHERE r.roomType.capacity >= :capacity
    AND r.roomType.id = :roomTypeId
    AND r.workBranch = :workBranch
    AND r.active = true
    AND r.id NOT IN (
        SELECT b.room.id FROM Booking b
        WHERE b.room.id IS NOT NULL
        AND b.statusBooking NOT IN ('CANCELLED')
        AND :checkIn < CASE
            WHEN b.statusBooking = 'CHECKED_OUT' AND b.CheckOutDate IS NOT NULL
                THEN FUNCTION('DATE', b.CheckOutDate)
            ELSE b.enventCheckoutDate
        END
        AND :checkOut > b.enventCheckinDate
    )
""")
    List<Room> findAvailableRoomBookingOff(
            @Param("workBranch") String workBranch,
            @Param("roomTypeId") Long roomTypeId,
            @Param("capacity")   int capacity,
            @Param("checkIn")    LocalDate checkIn,
            @Param("checkOut")   LocalDate checkOut
    );

    boolean existsByNameAndWorkBranch(String name, String workBranch);

    // lấy danh sach room restaus
    @Query("SELECT r FROM Room r WHERE r.workBranch = :workBranch AND r.status = :status AND r.active = true")
    List<Room> findByWorkBranchAndStatus(@Param("workBranch") String workBranch,
                                         @Param("status") StatusRoom status);

    // tìm kiếm room còn hoạt đongp
    Room findByIdAndActiveTrue(Long id);
}