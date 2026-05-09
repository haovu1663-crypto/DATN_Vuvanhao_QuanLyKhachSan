package re.quanlykhachsan.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import re.quanlykhachsan.entity.Booking;

@Repository
public interface BookingRespository extends JpaRepository<Booking,Long> {
  // truy vấn lấy ra booking đa được lập  dựa trên email và id phòng của khách
    @Query(value = """
    SELECT b.* FROM booking b
    JOIN customer c ON b.customer_id = c.id
    WHERE c.email = :email
    AND b.room_id = :roomId
    AND b.toyal_price IS NULL
    """, nativeQuery = true)
    Booking findByCustomerEmailAndRoomIdAndToyalPriceIsNull(
            @Param("email") String email,
            @Param("roomId") Long roomId
    );


}
