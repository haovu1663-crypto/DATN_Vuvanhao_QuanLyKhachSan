package re.quanlykhachsan.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import re.quanlykhachsan.dto.response.RoomTypeDisplayDTO;
import re.quanlykhachsan.entity.RoomType;
import re.quanlykhachsan.entity.StatusBooking;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface RoomTypeRepository extends JpaRepository<RoomType, Long> {
    // lấy roomtype theo điều kiên khách cần đặt
    @Query("""
    SELECT DISTINCT rt FROM RoomType rt 
    WHERE rt.capacity >= :capacity 
    AND EXISTS (
        SELECT r FROM Room r 
        WHERE r.roomType = rt
        AND LOWER(r.workBranch) LIKE LOWER(CONCAT('%', :workBranch, '%'))
        AND r.id NOT IN (
            SELECT b.room.id FROM Booking b 
            WHERE b.room IS NOT NULL 
            AND (:checkIn  < b.enventCheckoutDate 
            AND  :checkOut > b.enventCheckinDate)
        )
    )
""")
    List<RoomType> findAvailableRoomTypes(
            @Param("capacity")   int capacity,
            @Param("workBranch") String workBranch,
            @Param("checkIn")    LocalDate checkIn,
            @Param("checkOut")   LocalDate checkOut
    );


    // tìm kiếm tuyệt đối đúng chi nahnh của list roomtype  trong booking
    @Query("""
    SELECT DISTINCT rt FROM RoomType rt 
    WHERE rt.capacity >= :capacity 
    AND EXISTS (
        SELECT r FROM Room r 
        WHERE r.roomType = rt
        AND r.workBranch = :workBranch
        AND r.id NOT IN (
            SELECT b.room.id FROM Booking b 
            WHERE b.room IS NOT NULL 
            AND b.room.workBranch = :workBranch
            AND (:checkIn < b.enventCheckoutDate 
            AND  :checkOut > b.enventCheckinDate)
        )
    )
""")
    List<RoomType> findAvailableRoomTypesBooking(
            @Param("capacity")   int capacity,
            @Param("workBranch") String workBranch,
            @Param("checkIn")    LocalDate checkIn,
            @Param("checkOut")   LocalDate checkOut
    );



    // Tìm kiếm gần đúng theo workBranch (LIKE), trả về từng dòng rt+workBranch riêng.
    // Service sẽ gộp các dòng cùng rt.id lại thành 1 DTO với danh sách workBranches.
    // Ví dụ: tìm "hà nội" → trả cả "Hà Nội - Hoàn Kiếm" và "Hà Nội - Cầu Giấy" của cùng 1 RoomType.
    @Query("""
    SELECT DISTINCT new re.quanlykhachsan.dto.response.RoomTypeDisplayDTO(
        rt.id, 
        rt.type, 
        rt.capacity, 
        rt.amenities, 
        rt.description, 
        rt.price, 
        r.workBranch
    )
    FROM RoomType rt 
    JOIN Room r ON r.roomType = rt
    WHERE rt.capacity >= :capacity 
    AND LOWER(r.workBranch) LIKE LOWER(CONCAT('%', :workBranch, '%'))
    AND r.id NOT IN (
        SELECT b.room.id FROM Booking b 
        WHERE b.room IS NOT NULL 
        AND (:checkIn < b.enventCheckoutDate 
        AND  :checkOut > b.enventCheckinDate)
    )
""")
    List<RoomTypeDisplayDTO> findAvailableRoomTypesWithBranch(
            @Param("capacity")   int capacity,
            @Param("workBranch") String workBranch,
            @Param("checkIn")    LocalDate checkIn,
            @Param("checkOut")   LocalDate checkOut
    );

}