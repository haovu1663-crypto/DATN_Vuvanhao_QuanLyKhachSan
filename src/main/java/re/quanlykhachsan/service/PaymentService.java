package re.quanlykhachsan.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import re.quanlykhachsan.dto.request.PaymentRequest;
import re.quanlykhachsan.entity.Booking;
import re.quanlykhachsan.entity.MethodBooking;
import re.quanlykhachsan.entity.Payment;
import re.quanlykhachsan.exception.ResourceNotFoundException;
import re.quanlykhachsan.repository.BookingRespository;
import re.quanlykhachsan.repository.PaymentRespository;
import re.quanlykhachsan.service.interfac.IPaymentService;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class PaymentService implements IPaymentService {
    private final PaymentRespository paymentRespository;
    private final BookingRespository bookingRespository;
    @Override
    public String bookingDeposit(PaymentRequest paymentRequest)throws ResourceNotFoundException {
        Payment payment = new Payment();
        payment.setPaymentDate(LocalDateTime.now());
        payment.setAmount(paymentRequest.getAmount());
        payment.setMethod(MethodBooking.BANK_TRANSFER);
        payment.setStatus("Success");
        payment.setPaymentType("Đặt cọc");
        Booking booking = bookingRespository.findById(paymentRequest.getBooking_id()).orElseThrow(()->new ResourceNotFoundException("khồng tìm thấy Id booking"));
        payment.setBooking(booking);
        paymentRespository.save(payment);
        return "Thanh toán thành công tiền cọc ";
    }
}
