package re.quanlykhachsan.service;

import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import re.quanlykhachsan.dto.request.EmployeeRequest;
import re.quanlykhachsan.dto.response.EmployeeResponse;
import re.quanlykhachsan.entity.Customer;
import re.quanlykhachsan.entity.Employee;
import re.quanlykhachsan.exception.DataConfickException;
import re.quanlykhachsan.exception.ResourceNotFoundException;
import re.quanlykhachsan.repository.CustomerRespository;
import re.quanlykhachsan.repository.EmployeeRepository;
import re.quanlykhachsan.service.interfac.IEmployeeSevice;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EmployeeService implements IEmployeeSevice {
    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;
    private final ModelMapper modelMapper;
    private final CustomerRespository  customerRespository;
    @Override
    public EmployeeResponse add(EmployeeRequest employeeRequest) throws DataConfickException {
        if (employeeRepository.existsByEmail(employeeRequest.getEmail())) {
            throw new DataConfickException("Email này đã được đăng ký");
        }
        if (employeeRepository.existsByPhone(employeeRequest.getPhone())) {
            throw new DataConfickException("SDT này đã đươc đăng ký ");
        }
        if (employeeRepository.existsByUserName(employeeRequest.getUserName())) {
            throw new DataConfickException("UserName này đã được sử dụng vui lòng nhập lại ");
        }
        if(customerRespository.existsByUsername(employeeRequest.getUserName())) {
            throw new DataConfickException("UserName này đã được sử dụng vui lòng nhập lại ");
        }

        Employee employee = modelMapper.map(employeeRequest, Employee.class);
        employee.setPassword(passwordEncoder.encode(employeeRequest.getPassword()));
        employee.setRole("ROLE_EMPLOYEE");
        employee.setWorkBranch(employeeRequest.getWorkBranch());
        employeeRepository.save(employee);
        return modelMapper.map(employee, EmployeeResponse.class);
    }

    @Override
    public EmployeeResponse update(EmployeeRequest employeeRequest, Long id)throws ResourceNotFoundException,DataConfickException {
        if (!employeeRepository.existsById(id)) {
            throw new ResourceNotFoundException("không tìm thấy nhân viên nào có id : "+id);
        }
        Employee i = employeeRepository.findById(id).orElseThrow(()-> new ResourceNotFoundException("không tìm thấy "));
        if (employeeRepository.existsByEmail(employeeRequest.getEmail()) && i.getId()!=id) {
            throw new DataConfickException("Email này đã được đăng ký");
        }
        if (employeeRepository.existsByPhone(employeeRequest.getPhone()) && i.getId()!=id) {
            throw new DataConfickException("SDT này đã đươc đăng ký ");
        }
        if (employeeRepository.existsByUserName(employeeRequest.getUserName())&& i.getId()!=id) {
            throw new DataConfickException("UserName này đã được sử dụng vui lòng nhập lại ");
        }

        Employee employee = modelMapper.map(employeeRequest, Employee.class);
        if (employeeRequest.getPassword() != null && !employeeRequest.getPassword().isBlank()) {
            employee.setPassword(passwordEncoder.encode(employeeRequest.getPassword()));
        } else {
            employee.setPassword(i.getPassword()); // giữ nguyên password cũ
        }
        employee.setId(id);
        employeeRepository.save(employee);
        return modelMapper.map(employee, EmployeeResponse.class);
    }

    @Override
    public EmployeeResponse delete(Long id) throws ResourceNotFoundException {
        Employee employee = employeeRepository.findById(id).orElseThrow(()-> new ResourceNotFoundException("không tìm thấy nhân viên nào có id : "+id));
        employeeRepository.delete(employee);
        return modelMapper.map(employee, EmployeeResponse.class);
    }

    @Override
    public EmployeeRequest getbyId(Long id) throws ResourceNotFoundException{
        Employee employee = employeeRepository.findById(id).orElseThrow(()-> new ResourceNotFoundException("không tìm thấy nhân viên nào có id : "+id));
        return modelMapper.map(employee,EmployeeRequest.class);
    }

    @Override
    public List<EmployeeResponse> get() {
        List<Employee> employees = employeeRepository.findByActive(true);
        return employees.stream().map(en ->modelMapper.map(en,EmployeeResponse.class)).collect(Collectors.toList());
    }

    @Override
    public List<EmployeeResponse> getbyName(String name) {
        List<Employee> employees = employeeRepository.findByName(name);
        return employees.stream().map(en ->modelMapper.map(en,EmployeeResponse.class)).collect(Collectors.toList());
    }
    public void checkEmail(String email) throws DataConfickException {
        if (employeeRepository.existsByEmail(email)) {
            throw new DataConfickException("Email này đã được đăng ký rồi vui lòng nhập tài khoản khác ");
        }
    }
    public String getBranch(Long employeeId){
        Employee employee = employeeRepository.findById(employeeId).orElse(null);
        return employee.getWorkBranch();
    }

    @Override
    public String deleteSoft(Long id) throws ResourceNotFoundException {
        Employee employee = employeeRepository.findById(id).orElse(null);
        employee.setActive(false);
        employeeRepository.save(employee);
        return "xóa thành công";
    }
}
