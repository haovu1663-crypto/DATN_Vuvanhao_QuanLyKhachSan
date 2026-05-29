package re.quanlykhachsan.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class RevenueStatDTO {
    private String label;       // "Tháng 1", "Quý 2", "2024", ...
    private Double totalRevenue;
    private Long totalBooking;
}
