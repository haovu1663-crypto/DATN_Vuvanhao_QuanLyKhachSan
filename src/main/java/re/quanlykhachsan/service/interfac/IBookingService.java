package re.quanlykhachsan.service.interfac;

import re.quanlykhachsan.dto.request.BookingRequest;
import re.quanlykhachsan.dto.request.EmployeeBooking;
import re.quanlykhachsan.dto.response.*;
import re.quanlykhachsan.exception.ResourceNotFoundException;

import java.util.List;

public interface IBookingService {
    BookingRespone CustomerBooking(BookingRequest bookingRequest) throws ResourceNotFoundException;
    BookingRespone EmployeeBooking(EmployeeBooking employeeBooking) throws ResourceNotFoundException;
    void bookingCheckIn(Long employeeId,String email, Long roomId) throws ResourceNotFoundException;
    CheckOutRespone CheckOut(Long employeeId,String email,Long roomId) throws ResourceNotFoundException;

    //
    List<CheckInRespone> CheckIn(String workBranch) ;
    String checkInBooking(Long employeeId,Long bookingId,String cccd) throws ResourceNotFoundException;
    List<CheckOutBookingRespone> CheckOut(String workBranch) throws ResourceNotFoundException;
    CheckOutRespone checkOutBooking(Long bookingId) throws ResourceNotFoundException;
    List<SoPhongServiceRequest> soPhongService(String workBrach);
    String cancelBooking(Long bookingId) throws ResourceNotFoundException;

}
