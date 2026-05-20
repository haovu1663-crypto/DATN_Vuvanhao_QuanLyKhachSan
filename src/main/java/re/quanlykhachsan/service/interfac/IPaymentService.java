package re.quanlykhachsan.service.interfac;

import re.quanlykhachsan.dto.request.PaymentRequest;
import re.quanlykhachsan.exception.ResourceNotFoundException;

public interface IPaymentService {
    String bookingDeposit(PaymentRequest paymentRequest) throws ResourceNotFoundException;
    String bookingWithdrawal(PaymentRequest paymentRequest) throws ResourceNotFoundException;
    String bookingDepositEployee(PaymentRequest paymentRequest) throws ResourceNotFoundException;
}
