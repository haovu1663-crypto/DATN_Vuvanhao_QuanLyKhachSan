package re.quanlykhachsan.service;

import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import re.quanlykhachsan.dto.request.BookingRequest;
import re.quanlykhachsan.dto.request.EmployeeBooking;
import re.quanlykhachsan.dto.response.BookingRespone;
import re.quanlykhachsan.dto.response.CheckOutRespone;
import re.quanlykhachsan.entity.*;
import re.quanlykhachsan.exception.ResourceNotFoundException;
import re.quanlykhachsan.repository.*;
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
    private final PaymentRespository paymentRepository;
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
    public BookingRespone EmployeeBooking(EmployeeBooking bookingRequest) throws ResourceNotFoundException {
        Booking booking = new Booking();
        booking.setStatusBooking(StatusBooking.PENDING);
        booking.setCheckInDate(LocalDateTime.now());
        booking.setCheckOutDate(null);
        booking.setToyalPrice(null);
        booking.setName(bookingRequest.getName());
        booking.setPhonenumber(bookingRequest.getPhonenumber());

        Room room = roomRespository.findById(bookingRequest.getRoomId()).orElseThrow(()->new ResourceNotFoundException("không tìm thấy phòng này"));
        booking.setRoom(room);
        // ngày nhận trả dự kến
        booking.setEnventCheckinDate(bookingRequest.getEnventCheckinDate());
        booking.setEnventCheckoutDate(bookingRequest.getEnventCheckoutDate());
        // nhân viên sẽ là người ặt phòng
        Employee employee = employeeRespository.findById(bookingRequest.getEmployeeId()).orElse(null);
        booking.setEmployee(employee);
        bookingRespository.save(booking);
        roomService.updateStatusCurrentToChecked(bookingRequest.getRoomId());
        return modelMapper.map(booking, BookingRespone.class);
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

        Booking booking;
        if (email.contains("@")) {
            booking = bookingRespository.findByCustomerEmailAndRoomIdAndToyalPriceIsNull(email, roomId);
        } else {
           booking=bookingRespository.findBookingsByRoomIdAndPhoneAndToyalPriceIsNull(email, roomId);
        }
        Room room = roomRespository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phòng"));

        LocalDate today = LocalDate.now();

        // Tính số ngày thực tế ở: từ ngày check-in THỰC TẾ đến hôm nay
        LocalDate actualCheckin = booking.getCheckInDate().toLocalDate();

        long daysBetween;
        if (today.isBefore(booking.getEnventCheckoutDate())) {
            // Trả sớm → tính đủ theo hợp đồng (ngày dự kiến)
            daysBetween = ChronoUnit.DAYS.between(actualCheckin, booking.getEnventCheckoutDate());
        } else {
            // Đúng hạn hoặc quá hạn → tính theo thực tế
            daysBetween = ChronoUnit.DAYS.between(actualCheckin, today);
        }

//        // Tổng tiền = giá phòng * ngày + 5% phí dịch vụ
//        double totalPrice = room.getPrice() * daysBetween * 1.05;

        booking.setStatusBooking(StatusBooking.CHECKED_OUT);
        booking.setCheckOutDate(LocalDateTime.now());
//        booking.setToyalPrice(totalPrice);
        bookingRespository.save(booking);

        room.setStatus(StatusRoom.CLEANING);
        roomRespository.save(room);

        // ✅ Tiền còn lại = tổng tiền - tiền đã cọc
        // Bạn cần query Payment để lấy tiền đã deposit
        Double alreadyPaid = paymentRepository.findDepositAmountByBookingId(booking.getId());

        // Tiền còn lại cần thanh toán
//        Double remaining = totalPrice - alreadyPaid;

        CheckOutRespone response = new CheckOutRespone();
        response.setId(booking.getId());
//        response.setPrice(remaining); // ← đúng rồi, không còn = 0 nữa
        return response;
    }
}
