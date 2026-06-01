package re.quanlykhachsan.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import re.quanlykhachsan.entity.Order;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    // Tổng tiền dịch vụ của 1 booking
    @Query("SELECT COALESCE(SUM(o.amount), 0) FROM Order o WHERE o.booking.id = :bookingId")
    Double sumAmountByBookingId(@Param("bookingId") Long bookingId);
}