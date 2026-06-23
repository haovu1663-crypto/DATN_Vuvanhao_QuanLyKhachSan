package re.quanlykhachsan.dto.response;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class InfoBookedRespone {
    private Long roomId;
    private String roomName;
    private String customerName;
    private String phoneNumber;
    private LocalDate checkInDate;
    private LocalDate checkOutDate;
}
