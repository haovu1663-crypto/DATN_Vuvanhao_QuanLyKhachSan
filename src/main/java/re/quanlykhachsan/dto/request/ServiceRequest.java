package re.quanlykhachsan.dto.request;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
@Getter
@Setter
public class ServiceRequest {
    private String type;// loại dịch vụ
    private String name;// tên
    private String description;
    private List<MultipartFile> images;
    private List<String> keepImages; // URL ảnh cũ cần giữ lại khi update
    private Double price;

    private boolean active;
}