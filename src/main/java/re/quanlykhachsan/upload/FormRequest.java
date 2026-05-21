package re.quanlykhachsan.upload;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class FormRequest {
    private String email;
    private String cc;
    private String subject;
    private String content;
    private List<MultipartFile> file;
}
