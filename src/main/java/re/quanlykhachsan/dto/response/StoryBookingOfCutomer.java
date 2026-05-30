package re.quanlykhachsan.dto.response;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
public class StoryBookingOfCutomer {
    private Long bookingId;
    private String cutomerName;
    private String  roomName;
    private LocalDateTime checkInDate;
    private LocalDateTime checkOutDate;
    private LocalDate enventCheckInTime;
    private LocalDate enventCheckOutTime;
    private double price;
    private String status;
}
