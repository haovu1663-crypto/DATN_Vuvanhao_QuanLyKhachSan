package re.quanlykhachsan.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import re.quanlykhachsan.entity.RoomType;
import re.quanlykhachsan.entity.StatusBooking;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface RoomTypeRepository extends JpaRepository<RoomType, Long> {
    // lấy roomtype theo điều kiên khách cần đặt
    @Query("""
        SELECT DISTINCT rt FROM RoomType rt 
        JOIN Room r ON r.roomType.id = rt.id 
        WHERE rt.capacity >= :capacity 
        AND r.workBranch = :workBranch 
        AND r.id NOT IN (
            SELECT b.room.id FROM Booking b 
            WHERE b.room.id IS NOT NULL 
            AND (:checkIn BETWEEN b.enventCheckinDate AND b.enventCheckoutDate 
                 OR :checkOut BETWEEN b.enventCheckinDate AND b.enventCheckoutDate 
                 OR b.enventCheckinDate BETWEEN :checkIn AND :checkOut)
        )
    """)
    List<RoomType> findAvailableRoomTypes(
            @Param("capacity") int capacity,
            @Param("workBranch") String workBranch,
            @Param("checkIn") LocalDate checkIn,
            @Param("checkOut") LocalDate checkOut
    );
}
