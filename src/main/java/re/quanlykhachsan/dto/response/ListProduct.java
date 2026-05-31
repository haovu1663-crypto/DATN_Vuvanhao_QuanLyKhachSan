package re.quanlykhachsan.dto.response;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ListProduct {
    private Long id;
    private String name;// tên
    private List<String> images;
    private Double price;
}
