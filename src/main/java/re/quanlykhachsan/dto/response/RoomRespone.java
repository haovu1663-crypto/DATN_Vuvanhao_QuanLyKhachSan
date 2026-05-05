package re.quanlykhachsan.dto.response;

import lombok.Getter;
import lombok.Setter;
import re.quanlykhachsan.entity.StatusRoom;

import java.util.List;


@Getter
@Setter
public class RoomRespone {
    private Long id;
    private Long type_room_id;
    private String name;
    private StatusRoom status;
    private Double price;
    private List<String> images;
}
