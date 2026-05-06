package re.quanlykhachsan.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import re.quanlykhachsan.dto.request.EmployeeRequest;
import re.quanlykhachsan.dto.response.ApiResponse;
import re.quanlykhachsan.dto.response.EmployeeResponse;
import re.quanlykhachsan.exception.DataConfickException;
import re.quanlykhachsan.exception.ResourceNotFoundException;
import re.quanlykhachsan.repository.EmployeeRepository;
import re.quanlykhachsan.service.EmployeeService;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/v1/employees")
@RequiredArgsConstructor
public class EmployeeController {
    private final EmployeeService employeeService;
    @GetMapping
    public ResponseEntity<?> get() {
        ApiResponse<List<EmployeeResponse>> apiResponse = new ApiResponse<>(
                "Get Employee","400",employeeService.get()
        );
        return  new ResponseEntity<>(apiResponse,HttpStatus.OK);
    } @GetMapping("/name")
    public ResponseEntity<?> get(@RequestParam String name) {
        ApiResponse<List<EmployeeResponse>> apiResponse = new ApiResponse<>(
                "Get Employee","400",employeeService.getbyName(name)
        );
        return  new ResponseEntity<>(apiResponse, HttpStatus.OK);
    } @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) throws ResourceNotFoundException {
        ApiResponse<EmployeeResponse> apiResponse = new ApiResponse<>(
                "Get Employee","400",employeeService.getbyId(id)
        );
        return  new ResponseEntity<>(apiResponse, HttpStatus.OK);
    }
    @PostMapping("register")
    public ResponseEntity<?> save(@Valid @ModelAttribute EmployeeRequest employeeRequest) throws DataConfickException {
        ApiResponse<EmployeeResponse> apiResponse = new ApiResponse<>(
                "Add success","201.Created", employeeService.add(employeeRequest)
        );
        return  new ResponseEntity<>(apiResponse, HttpStatus.CREATED);
    }
    @PutMapping("/{id}")
    public ResponseEntity<?> upfate(@Valid @ModelAttribute EmployeeRequest employeeRequest,@PathVariable Long id) throws ResourceNotFoundException, DataConfickException {
        ApiResponse<EmployeeResponse> apiResponse = new ApiResponse<>(
                "Update success","200", employeeService.update(employeeRequest,id)
        );
        return  new ResponseEntity<>(apiResponse, HttpStatus.CREATED);
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) throws ResourceNotFoundException {
        ApiResponse<EmployeeResponse> apiResponse = new ApiResponse<>(
                "Delete success","200", employeeService.delete(id)
        );
        return  new ResponseEntity<>(apiResponse, HttpStatus.CREATED);
    }
}
