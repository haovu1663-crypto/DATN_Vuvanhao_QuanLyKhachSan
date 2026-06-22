package re.quanlykhachsan.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import re.quanlykhachsan.entity.Payment;

import java.util.List;

@Repository
public interface PaymentRespository extends JpaRepository<Payment, Long> {

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p " +
            "WHERE p.booking.id = :bookingId AND p.paymentType = 'DEPOSIT'")
    Double findDepositAmountByBookingId(@Param("bookingId") Long bookingId);

    // ===================== THỐNG KÊ DOANH THU =====================

    // Theo ngày - ASC cho biểu đồ (ngày cũ trước)
    @Query(value = "SELECT p.payment_date::DATE          AS ngay, " +
            "       SUM(p.amount)                 AS doanh_thu, " +
            "       COUNT(DISTINCT p.booking_id)  AS so_luong_booking " +
            "FROM payment p " +
            "JOIN booking b ON b.id = p.booking_id " +
            "WHERE p.status = 'Success' " +
            "AND b.status_booking = 'CHECKED_OUT' " +
            "GROUP BY p.payment_date::DATE ORDER BY ngay ASC",
            nativeQuery = true)
    List<Object[]> revenueByDayNativeAsc();

    // Theo ngày - DESC cho bảng (ngày mới trước)
    @Query(value = "SELECT p.payment_date::DATE          AS ngay, " +
            "       SUM(p.amount)                 AS doanh_thu, " +
            "       COUNT(DISTINCT p.booking_id)  AS so_luong_booking " +
            "FROM payment p " +
            "JOIN booking b ON b.id = p.booking_id " +
            "WHERE p.status = 'Success' " +
            "AND b.status_booking = 'CHECKED_OUT' " +
            "GROUP BY p.payment_date::DATE ORDER BY ngay DESC",
            nativeQuery = true)
    List<Object[]> revenueByDayNative();

    // Theo tháng trong năm
    @Query(value = "SELECT EXTRACT(MONTH FROM p.payment_date) AS thang, " +
            "       SUM(p.amount)                       AS doanh_thu, " +
            "       COUNT(DISTINCT p.booking_id)        AS so_luong_booking " +
            "FROM payment p " +
            "JOIN booking b ON b.id = p.booking_id " +
            "WHERE p.status = 'Success' " +
            "AND b.status_booking = 'CHECKED_OUT' " +
            "AND EXTRACT(YEAR FROM p.payment_date) = :year " +
            "GROUP BY thang ORDER BY thang",
            nativeQuery = true)
    List<Object[]> revenueByMonthInYearNative(@Param("year") int year);

    // Theo quý trong năm
    @Query(value = "SELECT EXTRACT(QUARTER FROM p.payment_date) AS quy, " +
            "       SUM(p.amount)                         AS doanh_thu, " +
            "       COUNT(DISTINCT p.booking_id)          AS so_luong_booking " +
            "FROM payment p " +
            "JOIN booking b ON b.id = p.booking_id " +
            "WHERE p.status = 'Success' " +
            "AND b.status_booking = 'CHECKED_OUT' " +
            "AND EXTRACT(YEAR FROM p.payment_date) = :year " +
            "GROUP BY quy ORDER BY quy",
            nativeQuery = true)
    List<Object[]> revenueByQuarterInYearNative(@Param("year") int year);

    // Theo năm
    @Query(value = "SELECT EXTRACT(YEAR FROM p.payment_date) AS nam, " +
            "       SUM(p.amount)                      AS doanh_thu, " +
            "       COUNT(DISTINCT p.booking_id)       AS so_luong_booking " +
            "FROM payment p " +
            "JOIN booking b ON b.id = p.booking_id " +
            "WHERE p.status = 'Success' " +
            "AND b.status_booking = 'CHECKED_OUT' " +
            "GROUP BY nam ORDER BY nam",
            nativeQuery = true)
    List<Object[]> revenueByYearNative();

    // ===================== THỐNG KÊ DOANH THU THEO CHI NHÁNH =====================

    // Theo ngày ASC – có lọc branch
    @Query(value = "SELECT p.payment_date::DATE AS ngay, " +
            "       SUM(p.amount) AS doanh_thu, " +
            "       COUNT(DISTINCT p.booking_id) AS so_luong_booking " +
            "FROM payment p " +
            "JOIN booking b ON b.id = p.booking_id " +
            "JOIN room r ON r.id = b.room_id " +
            "WHERE p.status = 'Success' " +
            "AND b.status_booking = 'CHECKED_OUT' " +
            "AND (:branch IS NULL OR :branch = '' OR r.work_branch = :branch) " +
            "GROUP BY p.payment_date::DATE ORDER BY ngay ASC",
            nativeQuery = true)
    List<Object[]> revenueByDayNativeAscBranch(@Param("branch") String branch);

    // Theo ngày DESC – có lọc branch
    @Query(value = "SELECT p.payment_date::DATE AS ngay, " +
            "       SUM(p.amount) AS doanh_thu, " +
            "       COUNT(DISTINCT p.booking_id) AS so_luong_booking " +
            "FROM payment p " +
            "JOIN booking b ON b.id = p.booking_id " +
            "JOIN room r ON r.id = b.room_id " +
            "WHERE p.status = 'Success' " +
            "AND b.status_booking = 'CHECKED_OUT' " +
            "AND (:branch IS NULL OR :branch = '' OR r.work_branch = :branch) " +
            "GROUP BY p.payment_date::DATE ORDER BY ngay DESC",
            nativeQuery = true)
    List<Object[]> revenueByDayNativeBranch(@Param("branch") String branch);

    // Theo tháng – có lọc branch
    @Query(value = "SELECT EXTRACT(MONTH FROM p.payment_date) AS thang, " +
            "       SUM(p.amount) AS doanh_thu, " +
            "       COUNT(DISTINCT p.booking_id) AS so_luong_booking " +
            "FROM payment p " +
            "JOIN booking b ON b.id = p.booking_id " +
            "JOIN room r ON r.id = b.room_id " +
            "WHERE p.status = 'Success' " +
            "AND b.status_booking = 'CHECKED_OUT' " +
            "AND EXTRACT(YEAR FROM p.payment_date) = :year " +
            "AND (:branch IS NULL OR :branch = '' OR r.work_branch = :branch) " +
            "GROUP BY thang ORDER BY thang",
            nativeQuery = true)
    List<Object[]> revenueByMonthInYearNativeBranch(@Param("year") int year, @Param("branch") String branch);

    // Theo quý – có lọc branch
    @Query(value = "SELECT EXTRACT(QUARTER FROM p.payment_date) AS quy, " +
            "       SUM(p.amount) AS doanh_thu, " +
            "       COUNT(DISTINCT p.booking_id) AS so_luong_booking " +
            "FROM payment p " +
            "JOIN booking b ON b.id = p.booking_id " +
            "JOIN room r ON r.id = b.room_id " +
            "WHERE p.status = 'Success' " +
            "AND b.status_booking = 'CHECKED_OUT' " +
            "AND EXTRACT(YEAR FROM p.payment_date) = :year " +
            "AND (:branch IS NULL OR :branch = '' OR r.work_branch = :branch) " +
            "GROUP BY quy ORDER BY quy",
            nativeQuery = true)
    List<Object[]> revenueByQuarterInYearNativeBranch(@Param("year") int year, @Param("branch") String branch);

    // Theo năm – có lọc branch
    @Query(value = "SELECT EXTRACT(YEAR FROM p.payment_date) AS nam, " +
            "       SUM(p.amount) AS doanh_thu, " +
            "       COUNT(DISTINCT p.booking_id) AS so_luong_booking " +
            "FROM payment p " +
            "JOIN booking b ON b.id = p.booking_id " +
            "JOIN room r ON r.id = b.room_id " +
            "WHERE p.status = 'Success' " +
            "AND b.status_booking = 'CHECKED_OUT' " +
            "AND (:branch IS NULL OR :branch = '' OR r.work_branch = :branch) " +
            "GROUP BY nam ORDER BY nam",
            nativeQuery = true)
    List<Object[]> revenueByYearNativeBranch(@Param("branch") String branch);

}