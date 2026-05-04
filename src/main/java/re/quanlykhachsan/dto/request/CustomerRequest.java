package re.quanlykhachsan.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CustomerRequest {

    @Pattern(regexp = "^[A-Za-z0-9_]{5,}$", message = "Username phải ít nhất 5 ký tự, không chứa khoảng trắng")
    private String username;
    @Size(min = 5, message = "Password phải có ít nhất 5 ký tự")
    private String password;
    @Email
    private String email;
    @Pattern(regexp = "^(0\\d{9}|(\\+84)\\d{9,10})$", message = "Số điện thoại Việt Nam không hợp lệ")
    private String phone;
    private String fullname;
}
