package re.quanlykhachsan.dto.response;

import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.Getter;
import lombok.Setter;
import re.quanlykhachsan.entity.Department;

@Getter
@Setter
public class EmployeeResponse {
    private Long id;
    private String name;
    private Department department;
    private String email;
    private String phone;
    private double salary;
}
