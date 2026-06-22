package re.quanlykhachsan.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class RoomTypeDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "room_type_id", nullable = false)
    private RoomType roomType;

    @NotBlank
    private String shortDescription;   // mô tả ngắn đầu trang

    @Column(columnDefinition = "TEXT")
    private String fullDescription;    // mô tả đầy đủ, hỗ trợ HTML

    private String thumbnailImage;     // ảnh đại diện trong danh sách

    @ElementCollection(fetch = FetchType.EAGER)
    private List<String> galleryImages; // slider ảnh trong trang chi tiết

    private Double roomSize;           // diện tích m²
    private String bedType;            // "King", "Queen", "Twin"
    private Integer bedCount;
    private String floorLevel;         // "Tầng cao", "Tầng thấp"
    private String viewType;           // "Nhìn ra thành phố", "Hướng hồ bơi"
    private Boolean smokingAllowed;

    @ElementCollection(fetch = FetchType.EAGER)
    private List<String> includedAmenities; // ["WiFi miễn phí", "Bãi đậu xe"]

    @ElementCollection(fetch = FetchType.EAGER)
    private List<String> policies;     // ["Không hoàn tiền", "Hủy miễn phí"]

    private String checkInTime;        // "14:00"
    private String checkOutTime;       // "12:00"
    private Double breakfastPrice;     // null = bao gồm hoặc không có

    private Integer maxExtraBeds;

    @ElementCollection(fetch = FetchType.EAGER)
    private List<String> highlightTags; // ["Bán chạy nhất", "Hủy miễn phí"]

    private Integer sortOrder;         // thứ tự hiển thị trong danh sách
}