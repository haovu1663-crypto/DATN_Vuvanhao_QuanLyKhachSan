package re.quanlykhachsan.service.interfac;

import re.quanlykhachsan.dto.request.RoomTypeRequest;
import re.quanlykhachsan.dto.response.RoomTypeResponse;
import re.quanlykhachsan.exception.DataConfickException;
import re.quanlykhachsan.exception.ResourceNotFoundException;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;

public interface IRoomTypeService {
    RoomTypeResponse add(RoomTypeRequest roomTypeRequest) throws IOException;
    RoomTypeResponse update(RoomTypeRequest roomTypeRequest,Long id) throws ResourceNotFoundException, IOException;
    RoomTypeResponse delete(Long id)  throws ResourceNotFoundException, DataConfickException;
    List<RoomTypeResponse> getListRoomType();
    List<RoomTypeResponse> getListRoomTypeByWorkBrankAndCapacityAndDate(Integer capacity, String workBranch, LocalDate checIn , LocalDate checOut) throws IOException;
    RoomTypeResponse getRoomTypeById(Long id) throws ResourceNotFoundException, IOException;
    List<RoomTypeResponse> getListRoomTypeByWorkBrankAndCapacityAndDateBookingOff(Integer capacity, String workBranch, LocalDate checIn , LocalDate checOut) throws IOException;
    String deleteRoomTypeSoft(Long id) throws ResourceNotFoundException, IOException;
}
