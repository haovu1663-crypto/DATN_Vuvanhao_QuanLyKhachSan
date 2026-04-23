package re.quanlykhachsan.service.interfac;

import re.quanlykhachsan.dto.request.RoomRequest;
import re.quanlykhachsan.dto.response.RoomRespone;
import re.quanlykhachsan.exception.ResourceNotFoundException;

import java.io.IOException;
import java.util.List;

public interface IRoomService {
    RoomRespone add(RoomRequest roomRequest) throws IOException;
    RoomRespone update(RoomRequest roomRequest,Long id) throws IOException, ResourceNotFoundException;
    RoomRespone delete(Long id)throws ResourceNotFoundException;
    List<RoomRespone> getListRoom();
}
