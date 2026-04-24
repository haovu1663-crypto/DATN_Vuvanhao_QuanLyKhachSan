package re.quanlykhachsan.service.interfac;

import re.quanlykhachsan.dto.request.EmployeeRequest;
import re.quanlykhachsan.dto.response.EmployeeResponse;
import re.quanlykhachsan.exception.DataConfickException;
import re.quanlykhachsan.exception.ResourceNotFoundException;

import java.util.List;

public interface IEmployeeSevice {
    EmployeeResponse add(EmployeeRequest employeeRequest) throws DataConfickException;
    EmployeeResponse update(EmployeeRequest employeeRequest, Long id) throws ResourceNotFoundException, DataConfickException;
    EmployeeResponse delete(Long id) throws ResourceNotFoundException;
    EmployeeResponse getbyId(Long id) throws ResourceNotFoundException;
    List< EmployeeResponse> get();
    List<EmployeeResponse> getbyName(String name);
}
