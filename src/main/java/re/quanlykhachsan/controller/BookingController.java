package re.quanlykhachsan.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import re.quanlykhachsan.dto.request.BookingRequest;
import re.quanlykhachsan.dto.request.EmployeeBooking;
import re.quanlykhachsan.dto.response.CheckInRespone;
import re.quanlykhachsan.dto.response.CheckOutBookingRespone;
import re.quanlykhachsan.exception.ResourceNotFoundException;
import re.quanlykhachsan.service.BookingService;

import java.util.List;

@RestController
@RequestMapping("/api/v1/booking")
@RequiredArgsConstructor
public class BookingController {
    private final BookingService bookingService;
    @PostMapping("/bookingonline")
    public ResponseEntity<?> bookingOnline(@Valid @ModelAttribute BookingRequest bookingRequest) throws ResourceNotFoundException {
        return new ResponseEntity<>(bookingService.CustomerBooking(bookingRequest), HttpStatus.OK);
    }
    @PostMapping("/bookingoffline")
    public ResponseEntity<?> bookingOffline(@Valid @ModelAttribute EmployeeBooking bookingRequest) throws ResourceNotFoundException {
        return new ResponseEntity<>(bookingService.EmployeeBooking(bookingRequest), HttpStatus.OK);
    }
    @PostMapping("/checkin/{employeeId}")
    public ResponseEntity<?> checkIn(
            @PathVariable Long employeeId,
            @RequestParam String email,
            @RequestParam Long roomId
    ) throws ResourceNotFoundException {
        bookingService.bookingCheckIn(employeeId, email, roomId);
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @PostMapping("/checkout/{employeeId}")
    public ResponseEntity<?> checkInout(
            @PathVariable Long employeeId,
            @RequestParam String email,
            @RequestParam Long roomId
    ) throws ResourceNotFoundException {

        return new ResponseEntity<>( bookingService.CheckOut(employeeId, email, roomId),HttpStatus.OK);
    }

    //
    @GetMapping("/checkin")
    public ResponseEntity<List<CheckInRespone>> getCheckin(@RequestParam String workBranch) {
        return new ResponseEntity<>(bookingService.CheckIn(workBranch), HttpStatus.OK);
    }
    @PostMapping("/checkinbooking")
    public ResponseEntity<String> getCheckin(@RequestParam Long employeeId,@RequestParam Long bookingId,@RequestParam String cccd) throws ResourceNotFoundException {
        return new ResponseEntity<>(bookingService.checkInBooking(employeeId,bookingId,cccd), HttpStatus.OK);
    }
    @GetMapping("/checkout")
    public ResponseEntity<List<CheckOutBookingRespone>> getCheckOut(@RequestParam String workBranch) {
        return new ResponseEntity<>(bookingService.CheckOut(workBranch), HttpStatus.OK);
    }
    @PostMapping("/checkoutns")
    public ResponseEntity<?> checkOut(@RequestParam Long bookingId) throws ResourceNotFoundException {
        return new ResponseEntity<>(bookingService.checkOutBooking(bookingId), HttpStatus.OK);
    }
   // lich sử đã check in
   @GetMapping("/storychcekout/{id}")
   public ResponseEntity<?> storycheckOut(@PathVariable Long id) {
       return new ResponseEntity<>(bookingService.storyBookingOfCutomerCheckOut(id), HttpStatus.OK);
   }
    @GetMapping("/storychcekin/{id}")
    public ResponseEntity<?> storycheckIn(@PathVariable Long id) {
        return new ResponseEntity<>(bookingService.storyBookingOfCutomerCheckIn(id), HttpStatus.OK);
    }
    @GetMapping("/storypending/{id}")
    public ResponseEntity<?> storypending(@PathVariable Long id) {
        return new ResponseEntity<>(bookingService.storyBookingOfCutomerPending(id), HttpStatus.OK);
    }
    @GetMapping("/roomservice")
    public ResponseEntity<?> roomservice(@RequestParam String workBrach) {
        return new ResponseEntity<>(bookingService.soPhongService(workBrach), HttpStatus.OK);
    }
    @PostMapping("/cancelbooking")
    public ResponseEntity<?> cancelbooking(@RequestParam Long bookingId) throws ResourceNotFoundException {
        return new  ResponseEntity<>(bookingService.cancelBooking(bookingId),HttpStatus.OK);
    }
}
