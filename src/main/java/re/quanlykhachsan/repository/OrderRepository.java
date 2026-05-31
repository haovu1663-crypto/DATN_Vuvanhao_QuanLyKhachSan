package re.quanlykhachsan.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import re.quanlykhachsan.entity.Order;
@Repository
public interface OrderRepository extends JpaRepository<Order,Long> {
}
