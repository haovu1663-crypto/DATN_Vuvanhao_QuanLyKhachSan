package re.quanlykhachsan.service.interfac;

import re.quanlykhachsan.dto.request.BookingRequest;
import re.quanlykhachsan.dto.response.BookingRespone;
import re.quanlykhachsan.exception.ResourceNotFoundException;

public interface IBookingService {
    BookingRespone CustomerBooking(BookingRequest bookingRequest) throws ResourceNotFoundException;
    BookingRespone EmployeeBooking(BookingRequest bookingRequest);
    void bookingCheckIn(Long employeeId,String email, Long roomId) throws ResourceNotFoundException;

}
