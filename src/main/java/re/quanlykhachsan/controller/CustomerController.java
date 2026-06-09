package re.quanlykhachsan.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import re.quanlykhachsan.dto.request.CustomerRequest;
import re.quanlykhachsan.dto.request.EmployeeRequest;
import re.quanlykhachsan.dto.request.Login;
import re.quanlykhachsan.dto.response.ApiResponse;
import re.quanlykhachsan.dto.response.EmployeeResponse;
import re.quanlykhachsan.exception.DataConfickException;
import re.quanlykhachsan.exception.ResourceNotFoundException;
import re.quanlykhachsan.service.interfac.ICustomerService;
import re.quanlykhachsan.service.interfac.IEmployeeSevice;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/customer")
public class CustomerController {
    private final ICustomerService customerService;
    private final IEmployeeSevice employeeSevice;
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @ModelAttribute CustomerRequest customerRequest) throws DataConfickException {
        return new ResponseEntity<>(customerService.register(customerRequest), HttpStatus.OK);
    }
    @PostMapping("/login")
    public ResponseEntity<?>login(@Valid @ModelAttribute Login login) throws DataConfickException {
        return new ResponseEntity<>(customerService.logi(login),HttpStatus.OK);
    }
    @PutMapping("/emp/{id}")
    public ResponseEntity<?> upfate(@Valid @ModelAttribute EmployeeRequest employeeRequest, @PathVariable Long id) throws ResourceNotFoundException, DataConfickException {
        ApiResponse<EmployeeResponse> apiResponse = new ApiResponse<>(
                "Update success","200", employeeSevice.update(employeeRequest,id)
        );
        return  new ResponseEntity<>(apiResponse, HttpStatus.CREATED);
    }
    @PutMapping("/mk")
    public ResponseEntity<?> updateMl(String email , String mk ) throws ResourceNotFoundException, DataConfickException {
        ApiResponse<String> apiResponse = new ApiResponse<>(
                "Update success","200",customerService.updatePassword(email,mk)
        );
        return  new ResponseEntity<>(apiResponse, HttpStatus.CREATED);
    }
}
