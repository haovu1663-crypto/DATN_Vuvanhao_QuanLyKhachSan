package re.quanlykhachsan.dto.response;

import lombok.Getter;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
@Getter
@Setter
public class ServiceRespone {
    private String type;// loại dịch vụ
    private String name;// tên
    private String description;
    private List<String> images;
    private Double price;
    private boolean active; // phải trùng tên với entity để ModelMapper map được
}