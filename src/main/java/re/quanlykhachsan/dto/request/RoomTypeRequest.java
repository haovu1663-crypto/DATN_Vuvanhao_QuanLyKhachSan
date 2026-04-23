package re.quanlykhachsan.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RoomTypeRequest {
    @NotBlank(message = "không được để chống ")
    private String type;
    @NotNull
    @Min(value = 1, message = "sức chứa phải lớn hơn 0")
    @Max(value = 15,message = "Sức chứa của phòng tối đa là 15 người")
    private int capacity;
    @NotBlank(message = "không được để chống")
    private String amenities;// nội thất
    private String description;
}
