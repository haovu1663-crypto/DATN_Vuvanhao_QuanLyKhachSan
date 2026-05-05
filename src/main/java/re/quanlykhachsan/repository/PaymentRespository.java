package re.quanlykhachsan.repository;

import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import re.quanlykhachsan.entity.Payment;

@Repository
public interface PaymentRespository extends JpaRepository<Payment,Long>
{

}
