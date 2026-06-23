package re.quanlykhachsan.service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import re.quanlykhachsan.dto.request.BookingRequest;
import re.quanlykhachsan.dto.request.EmployeeBooking;
import re.quanlykhachsan.dto.response.*;
import re.quanlykhachsan.entity.*;
import re.quanlykhachsan.exception.ResourceNotFoundException;
import re.quanlykhachsan.repository.*;
import re.quanlykhachsan.repository.OrderRepository;
import re.quanlykhachsan.service.interfac.IBookingService;
import re.quanlykhachsan.upload.MailService;
import re.quanlykhachsan.dto.response.EmailRespone;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

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
    private final OrderRepository orderRepository;
    private final MailService mailService;
    @Override
    @Transactional
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
        booking.setName(customer.getFullname());
        booking.setPhonenumber(customer.getPhone());
        // ngày nhận trả dự kến
        booking.setEnventCheckinDate(bookingRequest.getEnventCheckinDate());
        booking.setEnventCheckoutDate(bookingRequest.getEnventCheckoutDate());
        // nhân viên sẽ để null
        booking.setEmployee(null);

        // Lấy dữ liệu eager TRƯỚC khi session đóng (tránh lazy-load proxy lỗi)
        String roomName = room.getName();
        String workBranch = room.getWorkBranch();
        Double roomPrice = room.getRoomType().getPrice();
        String customerEmail = customer.getEmail();
        String customerName = customer.getFullname();

        bookingRespository.save(booking);
        roomService.upadteRoomCurrnetlyTenant(bookingRequest.getRoomId());

        // Gửi email xác nhận đặt phòng
        try {
            EmailRespone emailRespone = new EmailRespone();
            emailRespone.setNameRoom(roomName);
            emailRespone.setNameCutomer(customerName);
            emailRespone.setWorkBranch(workBranch);
            emailRespone.setPrice(roomPrice);
            emailRespone.setCheckInEnventDate(booking.getEnventCheckinDate().atStartOfDay());
            emailRespone.setCheckOutEnventDate(booking.getEnventCheckoutDate().atStartOfDay());
            emailRespone.setCreate(LocalDateTime.now());
            emailRespone.setBody("Cảm ơn quý khách đã đặt phòng. Chúng tôi sẽ liên hệ xác nhận sớm nhất.");
            mailService.sendBookingConfirmation(customerEmail, emailRespone);
        } catch (Exception e) {
            System.err.println("Gửi email thất bại: " + e.getMessage());
        }

        return modelMapper.map(booking, BookingRespone.class);
    }

    @Override
    public BookingRespone EmployeeBooking(EmployeeBooking bookingRequest) throws ResourceNotFoundException {
        Booking booking = new Booking();
        booking.setStatusBooking(StatusBooking.CHECKED_IN);
        booking.setCheckInDate(LocalDateTime.now());
        booking.setCheckOutDate(null);
        booking.setToyalPrice(null);
        booking.setName(bookingRequest.getName());
        booking.setPhonenumber(bookingRequest.getPhonenumber());
        booking.setCccd(bookingRequest.getCccd());

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
        // Gửi email xác nhận đặt phòng
//        String roomName = room.getName();
//        String workBranch = room.getWorkBranch();
//        Double roomPrice = room.getRoomType().getPrice();
//        String customerEmail = customer.getEmail();
//        String customerName = customer.getFullname();
//        try {
//            EmailRespone emailRespone = new EmailRespone();
//            emailRespone.setNameRoom(roomName);
//            emailRespone.setNameCutomer(customerName);
//            emailRespone.setWorkBranch(workBranch);
//            emailRespone.setPrice(roomPrice);
//            emailRespone.setCheckInEnventDate(booking.getEnventCheckinDate().atStartOfDay());
//            emailRespone.setCheckOutEnventDate(booking.getEnventCheckoutDate().atStartOfDay());
//            emailRespone.setCreate(LocalDateTime.now());
//            emailRespone.setBody("Cảm ơn quý khách đã đặt phòng. Chúng tôi sẽ liên hệ xác nhận sớm nhất.");
//            mailService.sendBookingConfirmation(customerEmail, emailRespone);
//        } catch (Exception e) {
//            System.err.println("Gửi email thất bại: " + e.getMessage());
//        }
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


    @Override
    public List<CheckInRespone> CheckIn(String workBranch) {
        List<Booking> checkIn = bookingRespository.findBookingsNullOrBeforeToday(workBranch);
        List<CheckInRespone> checkInRespones =  checkIn.stream().map(
                n->{
                    CheckInRespone checkInRespone = new CheckInRespone();
                    checkInRespone.setBookingId(n.getId());
                    checkInRespone.setRoomId(n.getRoom().getId());
                    checkInRespone.setRoomName(n.getRoom().getName());
                    checkInRespone.setRoomType(n.getRoom().getRoomType().getType());
                    checkInRespone.setCheckin(n.getEnventCheckinDate());
                    checkInRespone.setCheckout(n.getEnventCheckoutDate());
                    return checkInRespone;
                }
        ).toList();
        return checkInRespones;
    }

    @Override
    public String checkInBooking(Long employeeId, Long bookingId,String cccd) throws ResourceNotFoundException {
        Booking booking= bookingRespository.findById(bookingId).orElseThrow(()-> new ResourceNotFoundException("không tìm thấy hóa đơn đặt phòng "));
        Employee e = employeeRespository.findById(employeeId).orElseThrow(()-> new ResourceNotFoundException("không tìm thấy nhân viên này "));
        booking.setCheckInDate( LocalDateTime.now());
        booking.setEmployee(e);
        booking.setCccd(cccd);
        booking.setStatusBooking(StatusBooking.CHECKED_IN);
        bookingRespository.save(booking);
        return "Quý khách đã CheckIn thành công " ;
    }

    @Override
    public List<CheckOutBookingRespone> CheckOut(String workBranch) {
        List<Booking> checkIn = bookingRespository.findBookingsCheckOutIsNull(workBranch);
        List<CheckOutBookingRespone> checkOutRespones =  checkIn.stream().map(
                n->{
                    CheckOutBookingRespone checkOutRespone = new CheckOutBookingRespone();
                    checkOutRespone.setBookingId(n.getId());
                    String customerName = (n.getCustomer() != null) ? n.getCustomer().getFullname() : n.getName();
                    checkOutRespone.setCustomerName(customerName);
                    checkOutRespone.setRoomName(n.getRoom().getName());
                    checkOutRespone.setRoomType(n.getRoom().getRoomType().getType());
                    checkOutRespone.setCheckIntDate(n.getCheckInDate());
                    checkOutRespone.setEnventCheckOutDate(n.getEnventCheckoutDate());
                    return checkOutRespone;
                }
        ).toList();
        return checkOutRespones;
    }


    @Override
    @Transactional
    public CheckOutRespone checkOutBooking(Long bookingId) throws ResourceNotFoundException {
        Booking booking = bookingRespository.findByIdWithRoomAndRoomType(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy booking"));
        booking.setCheckOutDate(LocalDateTime.now());
        booking.setStatusBooking(StatusBooking.CHECKED_OUT);
        Room  room = roomRespository.findById(booking.getRoom().getId()).orElse(null);
        room.setStatus(StatusRoom.CLEANING);
        roomRespository.save(room);
        // --- Tiền phòng ---
        long daysBetween = ChronoUnit.DAYS.between(booking.getEnventCheckinDate(), booking.getEnventCheckoutDate());
        double roomAmount = booking.getRoom().getRoomType().getPrice() * daysBetween;

        // --- Tiền dịch vụ: tổng amount từ bảng orders theo bookingId ---
        Double serviceAmount = orderRepository.sumAmountByBookingId(bookingId);
        if (serviceAmount == null) serviceAmount = 0.0;

        // --- Tổng = tiền phòng + tiền dịch vụ ---
        double totalPrice = roomAmount + serviceAmount;
        booking.setToyalPrice(totalPrice);
        bookingRespository.save(booking);

        // --- Tiền đã cọc ---
        Double alreadyPaid = paymentRepository.findDepositAmountByBookingId(bookingId);
        if (alreadyPaid == null) alreadyPaid = 0.0;

        double remaining = totalPrice - alreadyPaid;

        CheckOutRespone response = new CheckOutRespone();
        response.setId(booking.getId());
        response.setPrice(remaining);          // còn lại cần thanh toán
        response.setRoomAmount(roomAmount);    // tiền phòng
        response.setServiceAmount(serviceAmount); // tiền dịch vụ
        response.setTotalPrice(totalPrice);    // tổng cộng
        response.setAlreadyPaid(alreadyPaid);  // đã cọc
        response.setDays((int) daysBetween);   // số ngày ở
        return response;
    }
    // hiện thi ls đặt phòng đã đã
    public List<StoryBookingOfCutomer> storyBookingOfCutomerCheckOut(Long id) {
        List<Booking> bookings = bookingRespository.findBookingsByCustomerAndStatus(id, StatusBooking.CHECKED_OUT);

        return bookings.stream()
                .map(booking -> {
                    StoryBookingOfCutomer dto = new StoryBookingOfCutomer();
                    dto.setBookingId(booking.getId());
                    dto.setPrice(booking.getToyalPrice()); // Lưu ý chính tả 'toyalPrice' từ entity của bạn
                    dto.setCutomerName(booking.getCustomer().getFullname());

                    // Sửa lại hàm set cho đúng (giả định DTO của bạn có hàm setRoomName hoặc tương đương)
                    dto.setRoomName(booking.getRoom().getName());

                    dto.setCheckInDate(booking.getCheckInDate());
                    dto.setCheckOutDate(booking.getCheckOutDate());
                    dto.setStatus("đã Kết thúc");
                    return dto;
                })
                .collect(Collectors.toList());
    }
    // hiện thi ls đặt phòng đã đã
    public List<StoryBookingOfCutomer> storyBookingOfCutomerCheckIn(Long id){
        List<Booking> bookings = bookingRespository.findBookingsByCustomerAndStatus(id, StatusBooking.CHECKED_IN);

        return bookings.stream()
                .map(booking -> {
                    StoryBookingOfCutomer dto = new StoryBookingOfCutomer();
                    dto.setBookingId(booking.getId());
                    dto.setPrice(0); // Lưu ý chính tả 'toyalPrice' từ entity của bạn
                    dto.setCutomerName(booking.getCustomer().getFullname());

                    // Sửa lại hàm set cho đúng (giả định DTO của bạn có hàm setRoomName hoặc tương đương)
                    dto.setRoomName(booking.getRoom().getName());

                    dto.setCheckInDate(booking.getCheckInDate());
                    dto.setCheckOutDate(booking.getCheckOutDate());
                    dto.setStatus("đã Kết thúc");
                    return dto;
                })
                .collect(Collectors.toList());
    }
    public List<StoryBookingOfCutomer> storyBookingOfCutomerPending(Long id) {
        List<Booking> bookings = bookingRespository.findBookingsByCustomerAndStatus(id, StatusBooking.PENDING);

        return bookings.stream()
                .map(booking -> {
                    StoryBookingOfCutomer dto = new StoryBookingOfCutomer();
                    dto.setBookingId(booking.getId());
                    dto.setPrice(0);
                    dto.setCutomerName(booking.getCustomer().getFullname());
                    dto.setRoomName(booking.getRoom().getName());

                    // Ngày dự kiến (khách đặt online)
                    dto.setEnventCheckInTime(booking.getEnventCheckinDate());   // fix: trước đặt nhầm setEnventCheckOutTime
                    dto.setEnventCheckOutTime(booking.getEnventCheckoutDate());

                    // Ngày thực tế nhận / trả (PENDING thường null, FE sẽ kiểm tra và hiển nếu có)
                    dto.setCheckInDate(booking.getCheckInDate());
                    dto.setCheckOutDate(booking.getCheckOutDate());

                    dto.setStatus("Chờ xác nhận");   // fix: status đúng nghĩa
                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Override
    public List<SoPhongServiceRequest> soPhongService(String workBrach) {
        List<Booking> bookings = bookingRespository.findByRoom_WorkBranchAndStatusBooking(workBrach, StatusBooking.CHECKED_IN);
        List<SoPhongServiceRequest> soPhongRequests = bookings.stream()
                .map(room -> {
                    SoPhongServiceRequest request = new SoPhongServiceRequest();
                    request.setId(room.getId());           // booking id ✅
                    request.setName(room.getRoom().getName());     // tên phòng ✅
                    request.setNameCutomer(room.getName());
                    return request;
                })
                .toList();
        return soPhongRequests;
    }

    @Override
    public String cancelBooking(Long bookingId) throws ResourceNotFoundException {
        Booking booking = bookingRespository.findById(bookingId).orElseThrow(()-> new ResourceNotFoundException("khoong tim thấy"));
        booking.setEnventCheckinDate(null);
        booking.setEnventCheckoutDate(null);
        booking.setStatusBooking(StatusBooking.CANCELLED);
        bookingRespository.save(booking);
        return "Hủy thành công booking";
    }

    @Override
    public List<InfoBookedRespone> InfoBooked(String workBranch, String roomName) throws ResourceNotFoundException {
        List<Booking> bookings = bookingRespository.findActiveBookingsByRoomNameAndWorkBranch(roomName, workBranch);
        List<InfoBookedRespone> infoBookedRespones = bookings.stream()
                .map(booking -> {
                    InfoBookedRespone request = new InfoBookedRespone();
                    request.setRoomId(booking.getRoom().getId());
                    request.setRoomName(booking.getRoom().getName());
                    request.setCustomerName(booking.getName());
                    request.setPhoneNumber(booking.getPhonenumber());
                    request.setCheckInDate(booking.getEnventCheckinDate());
                    request.setCheckOutDate(booking.getEnventCheckoutDate());
                    return request;
                })
                .toList();
        return infoBookedRespones;
    }

    @Override
    @Transactional
    public List<InfoCutomerRespone> InfoCutomer(String workBranch) {
        List<Booking> bookings = bookingRespository.findByWorkBranchAndCheckedIn(workBranch);
        List<InfoCutomerRespone> infoCutomerRespones = bookings.stream()
                .map(booking -> {
                InfoCutomerRespone request = new InfoCutomerRespone();
                request.setRoomName(booking.getRoom().getName());
                request.setName(booking.getName());
                request.setSdt(booking.getPhonenumber());
                request.setCccd(booking.getCccd());
                return request;
                })
                .toList();
        return infoCutomerRespones;
    }
}