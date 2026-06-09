package re.quanlykhachsan.upload;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import re.quanlykhachsan.entity.Booking;
import re.quanlykhachsan.entity.StatusBooking;
import re.quanlykhachsan.repository.BookingRespository;

import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
public class ExceptionCheckIn {
    private final BookingRespository bookingRespository;

    @Async
    @Scheduled(cron = "0 59 23 * * *")
    @Transactional
    public void autoCancelExpiredBookings() {
        LocalDate today = LocalDate.now();
        List<Booking> expiredBookings = bookingRespository
                .findByEnventCheckoutDateAndStatusBooking(today, StatusBooking.PENDING);
        expiredBookings.forEach(booking -> booking.setStatusBooking(StatusBooking.CANCELLED));
        bookingRespository.saveAll(expiredBookings);
    }
}
