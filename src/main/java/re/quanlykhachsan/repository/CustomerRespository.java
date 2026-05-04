package re.quanlykhachsan.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import re.quanlykhachsan.entity.Customer;

import java.util.Optional;

public interface CustomerRespository extends JpaRepository<Customer,Long> {

    Optional<Customer> findByUsername(String username);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    boolean existsByPhone(String phone);

    boolean existsByCccd(String cccd);
}
