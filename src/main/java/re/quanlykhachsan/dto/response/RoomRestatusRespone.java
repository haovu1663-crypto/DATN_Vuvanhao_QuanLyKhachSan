package re.quanlykhachsan.dto.response;

import lombok.Getter;
import lombok.Setter;
import re.quanlykhachsan.entity.StatusRoom;

import java.util.List;
@Getter
@Setter
public class RoomRestatusRespone {
    private Long id;
    private List<String> images;
    private String name;
    private StatusRoom status;
}
