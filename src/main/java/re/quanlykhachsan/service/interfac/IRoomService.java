package re.quanlykhachsan.service.interfac;

import org.springframework.data.repository.query.Param;
import re.quanlykhachsan.dto.request.RoomRequest;
import re.quanlykhachsan.dto.response.RoomRespone;
import re.quanlykhachsan.entity.StatusRoom;
import re.quanlykhachsan.exception.ResourceNotFoundException;

import java.io.IOException;
import java.util.List;

public interface IRoomService {
    RoomRespone add(RoomRequest roomRequest) throws IOException,ResourceNotFoundException;
    RoomRespone update(RoomRequest roomRequest,Long id) throws IOException, ResourceNotFoundException;
    RoomRespone delete(Long id)throws ResourceNotFoundException;
    List<RoomRespone> getListRoom();
    List<RoomRespone> getListRoomByStatusAvailble();
    void upadteRoomCurrnetlyTenant(Long id) throws ResourceNotFoundException;
    RoomRespone getRoomById(Long id) throws ResourceNotFoundException;
    List<RoomRespone> getListRoomByStatusClear() ;
    void updateClearToAvailble(Long id) throws ResourceNotFoundException;
    List<RoomRespone> getListRoomByStatusCurrentltTennat();
    List<RoomRespone> getListRoomByCustomerEmail( String email);
    List<RoomRespone> getListRoomByStatusCheckIn();
    List<RoomRespone> getListRoomByCustomerEmailCheckedIn( String email);

}
