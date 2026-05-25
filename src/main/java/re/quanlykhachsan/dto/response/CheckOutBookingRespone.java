package re.quanlykhachsan.dto.response;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
public class CheckOutBookingRespone {
    private Long bookingId;
    private String customerName;
    private String roomName;
    private String roomType;
    private LocalDateTime checkIntDate;
}
