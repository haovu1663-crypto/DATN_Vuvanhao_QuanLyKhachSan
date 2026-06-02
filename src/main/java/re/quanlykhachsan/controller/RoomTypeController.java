package re.quanlykhachsan.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import re.quanlykhachsan.dto.request.RoomTypeRequest;
import re.quanlykhachsan.dto.response.ApiResponse;
import re.quanlykhachsan.dto.response.RoomTypeDisplayDTO;
import re.quanlykhachsan.dto.response.RoomTypeResponse;
import re.quanlykhachsan.entity.RoomType;
import re.quanlykhachsan.exception.DataConfickException;
import re.quanlykhachsan.exception.ResourceNotFoundException;
import re.quanlykhachsan.repository.RoomTypeRepository;
import re.quanlykhachsan.service.RoomTypeService;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/roomtypes")
@RequiredArgsConstructor
public class RoomTypeController {
    private final RoomTypeRepository roomTypeRepository;
    private final RoomTypeService roomTypeService;


    @PostMapping("/add")
    public ResponseEntity<?> addRoomType(@Valid @ModelAttribute RoomTypeRequest roomTypeRequest) throws IOException {
        ApiResponse<RoomTypeResponse> apiResponse = new ApiResponse(
                "Add succsess", "201 CREATED", roomTypeService.add(roomTypeRequest)
        );
        return new ResponseEntity<>(apiResponse, HttpStatus.CREATED);
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    ResponseEntity<?> update(@Valid @ModelAttribute RoomTypeRequest roomTypeRequest, @PathVariable Long id) throws ResourceNotFoundException, IOException {
        ApiResponse<RoomTypeResponse> apiResponse = new ApiResponse(
                "update succsess", "400 Update", roomTypeService.update(roomTypeRequest, id)
        );
        return new ResponseEntity<>(apiResponse, HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    ResponseEntity<?> delete(@Valid @PathVariable Long id) throws ResourceNotFoundException, DataConfickException {
        ApiResponse<RoomTypeResponse> apiResponse = new ApiResponse(
                "delete succsess", "400 Delete", roomTypeService.delete(id)
        );
        return new ResponseEntity<>(apiResponse, HttpStatus.OK);
    }

    @GetMapping
    ResponseEntity<?> getRoomType() {
        ApiResponse<List<RoomTypeResponse>> apiResponse = new ApiResponse(
                "get RoomType", "400 ", roomTypeService.getListRoomType()
        );
        return new ResponseEntity<>(apiResponse, HttpStatus.OK);
    }

    @PreAuthorize("permitAll()")
    @GetMapping("/find")
    ResponseEntity<?> getRoomTypeFindCustomer() {
        ApiResponse<List<RoomTypeResponse>> apiResponse = new ApiResponse(
                "get RoomType", "400 ", roomTypeService.getListRoomType()
        );
        return new ResponseEntity<>(apiResponse, HttpStatus.OK);
    }

    @GetMapping("/id/{id}")
    ResponseEntity<?> getRoombyid(@PathVariable Long id) throws IOException, ResourceNotFoundException {
        ApiResponse<List<RoomTypeResponse>> apiResponse = new ApiResponse(
                "get RoomType", "400 ", roomTypeService.getRoomTypeById(id)
        );
        return new ResponseEntity<>(apiResponse, HttpStatus.OK);
    }
    // khách hàng tìm kiếm loại phòng online
    @GetMapping("/frindroom")
    ResponseEntity<?> getroomtypec(@RequestParam String workBranch, @RequestParam int capacity, @RequestParam LocalDate checkin, @RequestParam LocalDate checkout) throws IOException, ResourceNotFoundException {
        ApiResponse<List<RoomTypeResponse>> apiResponse = new ApiResponse(
                "get RoomType", "400 ", roomTypeService.getListRoomTypeByWorkBrankAndCapacityAndDate(capacity, workBranch, checkin, checkout)
        );
        return new ResponseEntity<>(apiResponse, HttpStatus.OK);
    }
    // employee tìm kiếm theo yêu cầu của khách hang
    @GetMapping("/frindroomoff")
    ResponseEntity<?> getroomtypeobokking(@RequestParam String workBranch, @RequestParam int capacity, @RequestParam LocalDate checkin, @RequestParam LocalDate checkout) throws IOException, ResourceNotFoundException {
        ApiResponse<List<RoomTypeResponse>> apiResponse = new ApiResponse(
                "get RoomType", "400 ", roomTypeService.getListRoomTypeByWorkBrankAndCapacityAndDateBookingOff(capacity, workBranch, checkin, checkout)
        );
        return new ResponseEntity<>(apiResponse, HttpStatus.OK);
    }
    // khách hàng tìm kiếm loại phòng online nhưng nó có thể cùng thành phố
    @GetMapping("/frindroomhn")
    ResponseEntity<?> getroomtypechn(@RequestParam String workBranch, @RequestParam int capacity, @RequestParam LocalDate checkin, @RequestParam LocalDate checkout) throws IOException, ResourceNotFoundException {
        ApiResponse<List<RoomTypeDisplayDTO>> apiResponse = new ApiResponse(
                "get RoomType", "400 ", roomTypeService.getListRoomTypeByWorkBrankAndCapacityAndDate2(capacity, workBranch, checkin, checkout)
        );
        return new ResponseEntity<>(apiResponse, HttpStatus.OK);
    }
   @PutMapping("/delete/{id}")
   public ResponseEntity<?>deleteroomtype(@PathVariable Long id) throws ResourceNotFoundException, IOException{
        return new ResponseEntity<>(roomTypeService.deleteRoomTypeSoft(id),HttpStatus.OK);
   }
}
