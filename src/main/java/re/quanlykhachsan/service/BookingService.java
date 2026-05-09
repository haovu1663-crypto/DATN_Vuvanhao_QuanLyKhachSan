package re.quanlykhachsan.service;

import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import re.quanlykhachsan.dto.request.BookingRequest;
import re.quanlykhachsan.dto.response.BookingRespone;
import re.quanlykhachsan.dto.response.CheckOutRespone;
import re.quanlykhachsan.entity.*;
import re.quanlykhachsan.exception.ResourceNotFoundException;
import re.quanlykhachsan.repository.BookingRespository;
import re.quanlykhachsan.repository.CustomerRespository;
import re.quanlykhachsan.repository.EmployeeRepository;
import re.quanlykhachsan.repository.RoomRepository;
import re.quanlykhachsan.service.interfac.IBookingService;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

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

    @Override
    public void bookingCheckIn(Long employeeId, String email, Long roomId) throws ResourceNotFoundException {
       // lấy ra id boooking từ email khách đặt khòng
        Booking booking = bookingRespository.findByCustomerEmailAndRoomIdAndToyalPriceIsNull(email, roomId);



        booking.setStatusBooking(StatusBooking.CHECKED_IN);
        LocalDate today = LocalDate.now();

        if (today.isBefore(booking.getEnventCheckinDate())) {
            // Xử lý khi khách đến nhận phòng TRƯỚC ngày sự kiện bắt đầu
            throw  new RuntimeException("ngày nhận phòng của quý khác là "+booking.getEnventCheckinDate());
        }
        booking.setCheckInDate( LocalDateTime.now());
        Employee employee = employeeRespository.findById(employeeId).orElseThrow(()-> new ResourceNotFoundException("không tim thấy mã nhận viên "));
        booking.setEmployee(employee);
        bookingRespository.save(booking);
        roomService.updateStatusCurrentToChecked(roomId);
   }

    @Override
    public CheckOutRespone CheckOut(Long employeeId, String email, Long roomId) throws ResourceNotFoundException {
        // lấy ra booking của khách hàng
        Booking booking = bookingRespository.findByCustomerEmailAndRoomIdAndToyalPriceIsNull(email, roomId);
        booking.setStatusBooking(StatusBooking.CHECKED_OUT);
        LocalDate today = LocalDate.now();
        booking.setCheckOutDate( LocalDateTime.now());
        // lấy ra room để lấy giá của phòng
        Room room = roomRespository.findById(roomId).orElseThrow(()->new RuntimeException("không tìm thấy "));

            // tổng tiền
            long daysBetween = ChronoUnit.DAYS.between(booking.getEnventCheckinDate(), today);
            booking.setToyalPrice(room.getPrice()*daysBetween+(room.getPrice()*daysBetween*5/100));
            // nếu khách hàng không muốn ở nữa  thì sẽ
            if(today.isBefore(booking.getEnventCheckoutDate())){
                 daysBetween = ChronoUnit.DAYS.between(booking.getEnventCheckinDate(), booking.getEnventCheckoutDate());
                booking.setToyalPrice(room.getPrice()*daysBetween+(room.getPrice()*daysBetween*5/100));
            }

            // lưu ngày trả phòng và
            bookingRespository.save(booking);

            room.setStatus(StatusRoom.CLEANING);
            roomRespository.save(room);
            // trả về Check out  respone để tạo hóa đơn
            CheckOutRespone checkOutRespone = new CheckOutRespone();
            checkOutRespone.setId(booking.getId());
            // tính tiền tạo nên hóa đơn thứ thanh toán tiền cìn lại
            Long days =ChronoUnit.DAYS.between(booking.getEnventCheckinDate(), booking.getEnventCheckoutDate());
            // số tiền đã cọc
            Double pricePaymented = room.getPrice()*daysBetween+(room.getPrice()*daysBetween*5/100);
            // số tiền còn thiếu trên hóa đơn
            Double privePayment = booking.getToyalPrice()-pricePaymented;
            checkOutRespone.setPrice(privePayment);
        return checkOutRespone;
    }
}
