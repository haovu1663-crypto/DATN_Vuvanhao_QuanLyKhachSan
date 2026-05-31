package re.quanlykhachsan.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OrderRequest {
    private Long bookingId;
    private Long serviceId;
    private Integer quantity;
}
