package re.quanlykhachsan.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import re.quanlykhachsan.dto.request.PaymentRequest;
import re.quanlykhachsan.exception.ResourceNotFoundException;
import re.quanlykhachsan.service.PaymentService;

@RestController
@RequestMapping("/api/v1/payment")
@RequiredArgsConstructor
public class PaymentController {
    private final PaymentService paymentService;
    @PostMapping("/deposit")
    public String deposit(@ModelAttribute PaymentRequest paymentRequest)throws ResourceNotFoundException {
        return paymentService.bookingDeposit(paymentRequest);
    }
    @PostMapping("/thanhtoan")
    public String thanhtoan(@ModelAttribute PaymentRequest paymentRequest)throws ResourceNotFoundException {
        return paymentService.bookingWithdrawal(paymentRequest);
    }
    @PostMapping("/deposit/employee")
    public String depositEmployee(@ModelAttribute PaymentRequest paymentRequest)throws ResourceNotFoundException {
        return paymentService.bookingDepositEployee(paymentRequest);
    }
}
