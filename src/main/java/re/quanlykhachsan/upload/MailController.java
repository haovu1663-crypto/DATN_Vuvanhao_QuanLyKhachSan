package re.quanlykhachsan.upload;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import re.quanlykhachsan.exception.DataConfickException;
import re.quanlykhachsan.service.CustomerService;
import re.quanlykhachsan.service.EmployeeService;

import java.util.concurrent.ThreadLocalRandom;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/email")
public class MailController {
    private final MailService mailService;
    private final CustomerService  customerService;
    private final EmployeeService employeeService;

    @PostMapping("/register")
    public ResponseEntity<?> mailregister(@RequestParam String email) throws DataConfickException {
        customerService.checkEmailRegister(email);
      int otp = ThreadLocalRandom.current().nextInt(1000, 10000);
        mailService.sendEmailNormal(email, "Mã OTP", String.valueOf(otp));
        return new ResponseEntity<>(otp, HttpStatus.OK) ;
    }
    @PostMapping("/booking")
    public ResponseEntity<?> mailBooking(@RequestParam String email,@RequestParam Long id) throws DataConfickException {
        customerService.checkEmailBooking(email, id);
        int otp = ThreadLocalRandom.current().nextInt(1000, 10000);
        mailService.sendEmailNormal(email, "Mã OTP", String.valueOf(otp));
        return new ResponseEntity<>(otp, HttpStatus.OK) ;
    }
    @PostMapping("/register/employee")
    public ResponseEntity<?> mailregisterEmployy(@RequestParam String email) throws DataConfickException {
        employeeService.checkEmail(email);
        int otp = ThreadLocalRandom.current().nextInt(1000, 10000);
        mailService.sendEmailNormal(email, "Mã OTP", String.valueOf(otp));
        return new ResponseEntity<>(otp, HttpStatus.OK) ;
    }
    @PostMapping("/mk")
    public ResponseEntity<?> mailMk(@RequestParam String email) throws DataConfickException {
        customerService.checkEmailMk(email);
        int otp = ThreadLocalRandom.current().nextInt(1000, 10000);
        mailService.sendEmailNormal(email, "Mã OTP", String.valueOf(otp));
        return new ResponseEntity<>(otp, HttpStatus.OK) ;
    }
}
