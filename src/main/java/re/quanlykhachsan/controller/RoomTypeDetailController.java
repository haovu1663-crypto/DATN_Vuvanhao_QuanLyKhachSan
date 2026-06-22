package re.quanlykhachsan.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import re.quanlykhachsan.dto.response.ApiResponse;
import re.quanlykhachsan.dto.response.RoomTypeResponse;
import re.quanlykhachsan.entity.RoomTypeDetail;
import re.quanlykhachsan.service.RoomTypeDetailService;
import re.quanlykhachsan.service.RoomTypeService;

import java.util.List;

@RestController
@RequestMapping("/api/v1/roomtypedetail")
@RequiredArgsConstructor
public class RoomTypeDetailController {
    private final RoomTypeDetailService roomTypeDetailService;
    @GetMapping("/{id}")
    ResponseEntity<?> getRoomType(@PathVariable Long id) {
        RoomTypeDetail roomTypeDetail = roomTypeDetailService.get(id);
        return new ResponseEntity<>(roomTypeDetail, HttpStatus.OK);
    }

}
