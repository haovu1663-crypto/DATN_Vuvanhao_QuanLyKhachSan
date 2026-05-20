package re.quanlykhachsan.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import re.quanlykhachsan.dto.request.BookingRequest;
import re.quanlykhachsan.dto.request.EmployeeBooking;
import re.quanlykhachsan.exception.ResourceNotFoundException;
import re.quanlykhachsan.service.BookingService;

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
}
