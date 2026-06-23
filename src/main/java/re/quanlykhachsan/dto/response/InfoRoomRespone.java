package re.quanlykhachsan.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class InfoRoomRespone {
    private Long id;
    private String roomName;
    private String roomType;
    private Double roomPrice;
    private String workBrach;
}
