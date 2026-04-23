package re.quanlykhachsan.dto.response;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RoomTypeResponse {
    private String type;
    private int capacity;
    private String amenities;// nội thất
    private String description;
}
