package re.quanlykhachsan.dto.request;

import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;
import re.quanlykhachsan.entity.StatusRoom;

import java.util.List;
@Getter
@Setter
public class RoomRequest {
    @NotNull(message = "không đc để chống loại phòng")
    private Long type_room_id;
    @NotBlank(message = "Không được để chống tên phòng ")
    private String name;
    @Enumerated(EnumType.STRING)
    private StatusRoom status;
    private List<MultipartFile> images;
    @NotNull(message = "kooong được để chống giá ")
    private Double price;
}
