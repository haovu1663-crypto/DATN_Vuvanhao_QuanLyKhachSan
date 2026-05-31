package re.quanlykhachsan.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import re.quanlykhachsan.entity.Service;

import java.util.List;

@Repository
public interface ServiceRepository extends JpaRepository<Service, Long> {

    boolean existsByNameAndType(String name, String type);

    List<Service> findByType(String type);

    @Query("SELECT s FROM Service s WHERE s.active = true")
    List<Service> findAllActive();
}