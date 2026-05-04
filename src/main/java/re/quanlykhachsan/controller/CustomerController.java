package re.quanlykhachsan.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import re.quanlykhachsan.dto.request.CustomerRequest;
import re.quanlykhachsan.dto.request.Login;
import re.quanlykhachsan.exception.DataConfickException;
import re.quanlykhachsan.service.interfac.ICustomerService;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/customer")
public class CustomerController {
    private final ICustomerService customerService;
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @ModelAttribute CustomerRequest customerRequest) throws DataConfickException {
        return new ResponseEntity<>(customerService.register(customerRequest), HttpStatus.OK);
    }
    @PostMapping("/login")
    public ResponseEntity<?>login(@Valid @ModelAttribute Login login) throws DataConfickException {
        return new ResponseEntity<>(customerService.logi(login),HttpStatus.OK);
    }
}
