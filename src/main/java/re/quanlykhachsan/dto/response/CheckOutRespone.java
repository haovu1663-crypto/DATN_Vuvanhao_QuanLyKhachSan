package re.quanlykhachsan.dto.response;

import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import re.quanlykhachsan.entity.StatusBooking;

import java.time.LocalDate;
import java.time.LocalDateTime;
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class CheckOutRespone {
    private Long id;// id booking để gán vào bay ment
    private  Double price;// tiền cần nhập vào pay ment,
}
