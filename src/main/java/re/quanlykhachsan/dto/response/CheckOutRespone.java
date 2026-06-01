package re.quanlykhachsan.dto.response;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CheckOutRespone {
    private Long id;            // bookingId

    private double roomAmount;    // tiền phòng  = giá/đêm × số ngày
    private double serviceAmount; // tiền dịch vụ = tổng orders
    private double totalPrice;    // tổng = roomAmount + serviceAmount
    private double alreadyPaid;   // đã cọc trước
    private double price;         // còn lại cần thanh toán = totalPrice - alreadyPaid
    private int    days;          // số ngày ở
}