package re.quanlykhachsan.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.web.bind.annotation.PathVariable;
import re.quanlykhachsan.entity.Employee;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee,Long> {
    @Query("SELECT e FROM Employee e WHERE e.name ILIKE :name")
    List<Employee> findByName(@Param("name") String name);


    boolean existsByEmail(String email);
    boolean existsByPhone(String phone);
    boolean existsByUserName(String userName);


    Optional<Employee> findByUserName(String username);
}
