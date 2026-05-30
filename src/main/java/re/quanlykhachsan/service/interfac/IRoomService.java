package re.quanlykhachsan.service.interfac;

import org.springframework.data.repository.query.Param;
import re.quanlykhachsan.dto.request.RoomRequest;
import re.quanlykhachsan.dto.response.RoomRespone;
import re.quanlykhachsan.dto.response.SoPhongRequest;
import re.quanlykhachsan.entity.StatusRoom;
import re.quanlykhachsan.exception.DataConfickException;
import re.quanlykhachsan.exception.ResourceNotFoundException;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;

public interface IRoomService {
    RoomRespone add(RoomRequest roomRequest) throws IOException, ResourceNotFoundException, DataConfickException;
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

    //
    List<SoPhongRequest> getListSoPhong(String workBranch, Long roomtypeId, LocalDate checkIn, LocalDate checkOut);
    List<SoPhongRequest> getListSoPhongBookingOff(String workBranch, Long roomtypeId, int capacity, LocalDate checkIn, LocalDate checkOut);
    List<SoPhongRequest> getRoomService(String workBranch);
}
