package re.quanlykhachsan.service.interfac;

import re.quanlykhachsan.dto.request.RoomTypeRequest;
import re.quanlykhachsan.dto.response.RoomTypeResponse;
import re.quanlykhachsan.exception.ResourceNotFoundException;

import java.util.List;

public interface IRoomTypeService {
    RoomTypeResponse add(RoomTypeRequest roomTypeRequest) ;
    RoomTypeResponse update(RoomTypeRequest roomTypeRequest,Long id) throws ResourceNotFoundException;
    RoomTypeResponse delete(Long id)  throws ResourceNotFoundException;
    List<RoomTypeResponse> getListRoomType();

}
