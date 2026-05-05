package re.quanlykhachsan.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import re.quanlykhachsan.entity.Booking;

@Repository
public interface BookingRespository extends JpaRepository<Booking,Long> {

}
