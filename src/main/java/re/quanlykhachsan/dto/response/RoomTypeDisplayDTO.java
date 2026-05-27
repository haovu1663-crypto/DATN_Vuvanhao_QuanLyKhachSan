package re.quanlykhachsan.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RoomTypeDisplayDTO {
    private Long id;
    private String type;
    private int capacity;
    private String amenities;
    private String description;
    private List<String> images;
    private Double price;
    private String workBranch; // chi nhánh cụ thể của dòng này

    // Constructor dùng cho JPQL new() — không có images vì Hibernate 7
    // không map được List<String> qua constructor expression
    public RoomTypeDisplayDTO(Long id, String type, int capacity,
                              String amenities, String description,
                              Double price, String workBranch) {
        this.id = id;
        this.type = type;
        this.capacity = capacity;
        this.amenities = amenities;
        this.description = description;
        this.price = price;
        this.workBranch = workBranch;
        this.images = new ArrayList<>();
    }
}