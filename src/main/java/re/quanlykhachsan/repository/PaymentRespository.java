package re.quanlykhachsan.repository;

import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import re.quanlykhachsan.entity.Payment;

@Repository
public interface PaymentRespository extends JpaRepository<Payment,Long>
{
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p " +
            "WHERE p.booking.id = :bookingId AND p.paymentType = 'DEPOSIT'")
    Double findDepositAmountByBookingId(@Param("bookingId") Long bookingId);
}
