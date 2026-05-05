package re.quanlykhachsan.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import re.quanlykhachsan.dto.request.BookingRequest;
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
}
