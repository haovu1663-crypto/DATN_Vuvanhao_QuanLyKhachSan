package re.quanlykhachsan.dto.request;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import re.quanlykhachsan.entity.Customer;
import re.quanlykhachsan.entity.Employee;
import re.quanlykhachsan.entity.Room;
import re.quanlykhachsan.entity.StatusBooking;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
public class BookingRequest {
    private LocalDate enventCheckinDate;
    private LocalDate enventCheckoutDate;
    private Long roomId;
    private Long  customerId;

}
