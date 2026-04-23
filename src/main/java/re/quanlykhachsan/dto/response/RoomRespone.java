package re.quanlykhachsan.dto.response;

import lombok.Getter;
import lombok.Setter;
import re.quanlykhachsan.entity.StatusRoom;


@Getter
@Setter
public class RoomRespone {

    private Long type_room_id;
    private String name;
    private StatusRoom status;
    private Double price;
}
