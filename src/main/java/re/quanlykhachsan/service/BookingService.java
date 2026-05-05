package re.quanlykhachsan.service;

import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import re.quanlykhachsan.dto.request.BookingRequest;
import re.quanlykhachsan.dto.response.BookingRespone;
import re.quanlykhachsan.entity.Booking;
import re.quanlykhachsan.entity.Customer;
import re.quanlykhachsan.entity.Room;
import re.quanlykhachsan.entity.StatusBooking;
import re.quanlykhachsan.exception.ResourceNotFoundException;
import re.quanlykhachsan.repository.BookingRespository;
import re.quanlykhachsan.repository.CustomerRespository;
import re.quanlykhachsan.repository.EmployeeRepository;
import re.quanlykhachsan.repository.RoomRepository;
import re.quanlykhachsan.service.interfac.IBookingService;

@Service
@RequiredArgsConstructor
public class BookingService implements IBookingService {
    private final BookingRespository bookingRespository;
    private final CustomerRespository customerRespository;
    private final EmployeeRepository employeeRespository;
    private final RoomRepository roomRespository;
    private final RoomService roomService;
    private final ModelMapper modelMapper;
    @Override
    public BookingRespone CustomerBooking(BookingRequest bookingRequest) throws ResourceNotFoundException {
        Booking booking = new Booking();
        booking.setStatusBooking(StatusBooking.PENDING);
        booking.setCheckInDate(null);
        booking.setCheckOutDate(null);
        booking.setToyalPrice(null);
        // vì là khách đặt phòng online nên sẽ không có id của nhân viên nên khi nào treck out sẽ thêm nhân viên \
        // thêm phong
        Room room = roomRespository.findById(bookingRequest.getRoomId()).orElseThrow(()->new ResourceNotFoundException("không tìm thấy phòng này"));
        booking.setRoom(room);
        Customer customer = customerRespository.findById(bookingRequest.getCustomerId()).orElseThrow(()->new ResourceNotFoundException("không tìm thấy khách hàng này trong hệ thống "));
        booking.setCustomer(customer);
        // ngày nhận trả dự kến
        booking.setEnventCheckinDate(bookingRequest.getEnventCheckinDate());
        booking.setEnventCheckoutDate(bookingRequest.getEnventCheckoutDate());
        // nhân viên sẽ để null
        booking.setEmployee(null);
        bookingRespository.save(booking);
        roomService.upadteRoomCurrnetlyTenant(bookingRequest.getRoomId());
        return modelMapper.map(booking, BookingRespone.class);
    }

    @Override
    public BookingRespone EmployeeBooking(BookingRequest bookingRequest) {
        return null;
    }
}
