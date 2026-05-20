package re.quanlykhachsan.dto.request;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class EmployeeBooking {
    private LocalDate enventCheckinDate;
    private LocalDate enventCheckoutDate;
    private Long roomId;
    private String phonenumber;
    private String name;
    private Long employeeId;
}
