package re.quanlykhachsan.dto.response;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
public class CheckInRespone {
    Long bookingId;
    Long roomId;
    String roomName;
    String roomType;
    LocalDate checkin;
    LocalDate checkout;
}
