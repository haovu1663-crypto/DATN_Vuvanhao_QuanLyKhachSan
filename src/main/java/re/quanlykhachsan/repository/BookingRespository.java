package re.quanlykhachsan.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import re.quanlykhachsan.entity.Booking;

import java.util.List;

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

    @Query("SELECT b FROM Booking b WHERE b.phonenumber = :phonenumber AND b.room.id = :roomId AND b.toyalPrice IS NULL")
    Booking findBookingsByRoomIdAndPhoneAndToyalPriceIsNull(
            @Param("phonenumber") String phonenumber,
            @Param("roomId") Long roomId
    );


    // danh sách checkin ngày hôm nay
    @Query("SELECT b FROM Booking b JOIN FETCH b.room r JOIN FETCH r.roomType WHERE (b.CheckInDate IS NULL AND b.enventCheckinDate <= CURRENT_DATE) ORDER BY b.enventCheckinDate DESC")
    List<Booking> findBookingsNullOrBeforeToday();
    // danh sach caanf check out
    @Query("SELECT b FROM Booking b JOIN FETCH b.room r JOIN FETCH r.roomType LEFT JOIN FETCH b.customer WHERE b.CheckOutDate IS NULL AND b.CheckInDate IS NOT NULL ORDER BY b.enventCheckinDate ASC")
    List<Booking> findBookingsCheckOutIsNull();
}