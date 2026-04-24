package re.quanlykhachsan.dto.request;

import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.jpa.repository.Query;
import re.quanlykhachsan.entity.Department;

@Getter
@Setter
public class EmployeeRequest {
    @NotBlank(message = "Không được để chống name")
    private String name;
    @NotNull(message = "Không đươc để chống Department ")
    private Department department;
    @Email(message = "Vui lòng điền đúng định dạng email")
    private String email;
    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(regexp = "^(0|84)(3|5|7|8|9)([0-9]{8})$", message = "Số điện thoại không đúng định dạng Việt Nam")
    private String phone;
    @Min(value = 6500000 ,message = "Mức lương tối thiểu của nhân viên là 6.5TR")
    private double salary;
    @NotBlank(message = "Username không được để trống")
    @Pattern(regexp = "^[a-zA-Z0-9_]{5,20}$", message = "Username từ 5-20 ký tự, không chứa ký tự đặc biệt")
    private String userName;
    @NotBlank(message = "Mật khẩu không được để trống")
    @Pattern(regexp = "^\\S{6,}$", message = "Mật khẩu phải từ 6 ký tự trở lên và không chứa khoảng trắng")
    private String password;

}
