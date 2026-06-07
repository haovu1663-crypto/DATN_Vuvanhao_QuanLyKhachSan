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
    AND rt.active = true
    AND EXISTS (
        SELECT r FROM Room r 
        WHERE r.roomType = rt
        AND r.active = true
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
    AND rt.active = true
    AND EXISTS (
        SELECT r FROM Room r 
        WHERE r.roomType = rt
        AND r.active = true
        AND r.workBranch = :workBranch
        AND r.id NOT IN (
            SELECT b.room.id FROM Booking b 
            WHERE b.room IS NOT NULL 
            AND b.room.workBranch = :workBranch
            AND b.statusBooking NOT IN ('CANCELLED')
            AND :checkIn < CASE
                WHEN b.statusBooking = 'CHECKED_OUT' AND b.CheckOutDate IS NOT NULL
                    THEN FUNCTION('DATE', b.CheckOutDate)
                ELSE b.enventCheckoutDate
            END
            AND :checkOut > b.enventCheckinDate
        )
    )
""")
    List<RoomType> findAvailableRoomTypesBooking(
            @Param("capacity")   int capacity,
            @Param("workBranch") String workBranch,
            @Param("checkIn")    LocalDate checkIn,
            @Param("checkOut")   LocalDate checkOut
    );



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
    AND rt.active = true
    AND r.active = true
    AND LOWER(r.workBranch) LIKE LOWER(CONCAT('%', :workBranch, '%'))
    AND r.id NOT IN (
        SELECT b.room.id FROM Booking b 
        WHERE b.room IS NOT NULL
        AND b.statusBooking NOT IN ('CANCELLED')
        AND :checkIn < CASE
            WHEN b.statusBooking = 'CHECKED_OUT' AND b.CheckOutDate IS NOT NULL
                THEN FUNCTION('DATE', b.CheckOutDate)
            ELSE b.enventCheckoutDate
        END
        AND :checkOut > b.enventCheckinDate
    )
""")
    List<RoomTypeDisplayDTO> findAvailableRoomTypesWithBranch(
            @Param("capacity")   int capacity,
            @Param("workBranch") String workBranch,
            @Param("checkIn")    LocalDate checkIn,
            @Param("checkOut")   LocalDate checkOut
    );
    // tìm kiếm theo id và active = true
    RoomType findByIdAndActiveTrue(Long id);

    // lấy tất cả roomtype đang active
    List<RoomType> findAllByActiveTrue();
}