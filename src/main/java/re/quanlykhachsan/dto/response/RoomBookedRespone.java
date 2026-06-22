package re.quanlykhachsan.dto.response;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import org.springframework.web.bind.annotation.GetMapping;

import java.time.LocalDateTime;

@Getter
@Setter
@RequiredArgsConstructor
@NoArgsConstructor
public class RoomBookedRespone {
    private Long roomId;
    private String roomName;
    private String customerName;
    private String phoneNumber;
    private LocalDateTime checkInDate;
    private LocalDateTime checkOutDate;
}
