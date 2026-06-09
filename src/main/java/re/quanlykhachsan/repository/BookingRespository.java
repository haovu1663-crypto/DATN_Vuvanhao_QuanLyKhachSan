package re.quanlykhachsan.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import re.quanlykhachsan.entity.Booking;
import re.quanlykhachsan.entity.StatusBooking;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

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
    @Query("SELECT b FROM Booking b JOIN FETCH b.room r JOIN FETCH r.roomType WHERE b.CheckInDate IS NULL AND b.enventCheckinDate <= CURRENT_DATE AND r.workBranch = :workBranch ORDER BY b.enventCheckinDate DESC")
    List<Booking> findBookingsNullOrBeforeToday(@Param("workBranch") String workBranch);
    // danh sach caanf check out
    @Query("SELECT b FROM Booking b JOIN FETCH b.room r JOIN FETCH r.roomType LEFT JOIN FETCH b.customer WHERE b.CheckOutDate IS NULL AND b.CheckInDate IS NOT NULL AND r.workBranch = :workBranch ORDER BY b.enventCheckinDate ASC")
    List<Booking> findBookingsCheckOutIsNull(@Param("workBranch") String workBranch);

    // lấy booking kèm room và roomType để tránh LazyInitializationException
    @Query("SELECT b FROM Booking b JOIN FETCH b.room r JOIN FETCH r.roomType WHERE b.id = :id")
    Optional<Booking> findByIdWithRoomAndRoomType(@Param("id") Long id);


    // lịch sử đặt phong cua khách hàng
    @Query("SELECT b FROM Booking b " +
            "JOIN FETCH b.customer " +        // ✅ load Customer luôn
            "JOIN FETCH b.room r " +           // ✅ load Room luôn (dùng ở dto)
            "JOIN FETCH r.roomType " +
            "WHERE b.customer.id = :customerId AND b.statusBooking = :status")
    List<Booking> findBookingsByCustomerAndStatus(
            @Param("customerId") Long customerId,
            @Param("status") StatusBooking statusBooking
    );

    // lấy ra booking có room đã ở để lam
    @Query("SELECT b FROM Booking b " +
            "JOIN FETCH b.room r " +
            "LEFT JOIN FETCH b.customer " +
            "LEFT JOIN FETCH b.employee " +
            "WHERE r.workBranch = :workBranch " +
            "AND b.statusBooking = :statusBooking")
    List<Booking> findByRoom_WorkBranchAndStatusBooking(
            @Param("workBranch") String workBranch,
            @Param("statusBooking") StatusBooking statusBooking
    );
    // làm bất đồng bộ
    List<Booking> findByEnventCheckoutDateAndStatusBooking(LocalDate enventCheckoutDate, StatusBooking statusBooking);
}