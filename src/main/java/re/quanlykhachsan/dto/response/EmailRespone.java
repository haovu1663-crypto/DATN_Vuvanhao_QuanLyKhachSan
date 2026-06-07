package re.quanlykhachsan.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class EmailRespone {
    private String nameRoom;
    private String nameCutomer;
    private String workBranch;
    private Double price;
    private LocalDateTime checkInEnventDate;
    private LocalDateTime checkOutEnventDate;
    private LocalDateTime create;
    private String body;
}
