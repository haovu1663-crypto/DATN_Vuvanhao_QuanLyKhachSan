package re.quanlykhachsan.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import re.quanlykhachsan.dto.request.RoomTypeRequest;
import re.quanlykhachsan.dto.response.ApiResponse;
import re.quanlykhachsan.dto.response.RoomTypeResponse;
import re.quanlykhachsan.entity.RoomType;
import re.quanlykhachsan.exception.ResourceNotFoundException;
import re.quanlykhachsan.service.RoomTypeService;

import java.util.List;

@RestController
@RequestMapping("/api/v1/roomtypes")
@RequiredArgsConstructor
public class RoomTypeController {
    private final RoomTypeService roomTypeService;
    @PostMapping
    public ResponseEntity<?> addRoomType(@Valid @ModelAttribute RoomTypeRequest roomTypeRequest){
        ApiResponse<RoomTypeResponse>  apiResponse = new ApiResponse(
                "Add succsess","201 CREATED",roomTypeService.add(roomTypeRequest)
        );
        return new ResponseEntity<>(apiResponse, HttpStatus.CREATED);
    }
    @PutMapping("/{id}")
    ResponseEntity<?> update(@Valid @ModelAttribute RoomTypeRequest roomTypeRequest ,@PathVariable Long id) throws ResourceNotFoundException {
        ApiResponse<RoomTypeResponse>  apiResponse = new ApiResponse(
                "update succsess","400 Update",roomTypeService.update(roomTypeRequest,id)
        );
        return new ResponseEntity<>(apiResponse, HttpStatus.OK);
    }
    @DeleteMapping("/{id}")
    ResponseEntity<?> delete(@Valid @PathVariable Long id) throws ResourceNotFoundException {
        ApiResponse<RoomTypeResponse>  apiResponse = new ApiResponse(
                "delete succsess","400 Delete",roomTypeService.delete(id)
        );
        return new ResponseEntity<>(apiResponse, HttpStatus.OK);
    }
    @GetMapping
    ResponseEntity<?> getRoomType()  {
        ApiResponse<List<RoomTypeResponse>>  apiResponse = new ApiResponse(
                "get RoomType","400 ",roomTypeService.getListRoomType()
        );
        return new ResponseEntity<>(apiResponse, HttpStatus.OK);
    }
}
