package re.quanlykhachsan.dto.request;

import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.Getter;
import lombok.Setter;
import re.quanlykhachsan.entity.Booking;
import re.quanlykhachsan.entity.MethodBooking;

import java.time.LocalDateTime;

@Getter
@Setter

public class PaymentRequest {
    private double amount;
    private Long booking_id;
}
