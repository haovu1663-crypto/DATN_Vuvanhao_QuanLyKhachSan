package re.quanlykhachsan.dto.response;

import lombok.Getter;
import lombok.Setter;
import re.quanlykhachsan.entity.Employee;
import re.quanlykhachsan.entity.StatusBooking;

import java.time.LocalDateTime;

@Getter
@Setter
public class BookingRespone {
    private Long id;
    private LocalDateTime CheckInDate;
    private LocalDateTime CheckOutDate;
    private StatusBooking statusBooking;
    private Double toyalPrice;
    private Long roomId;
    private Long  customerId;
    private Employee employee_id;
}
