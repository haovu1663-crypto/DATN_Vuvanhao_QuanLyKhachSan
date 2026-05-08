package re.quanlykhachsan.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import re.quanlykhachsan.dto.request.RoomRequest;
import re.quanlykhachsan.dto.response.ApiResponse;
import re.quanlykhachsan.dto.response.RoomRespone;
import re.quanlykhachsan.exception.ResourceNotFoundException;
import re.quanlykhachsan.service.interfac.IRoomService;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/v1/rooms")
@RequiredArgsConstructor
public class RoomController {
    private final IRoomService roomService;
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> addRoom(@Valid @ModelAttribute RoomRequest roomRequest) throws IOException,ResourceNotFoundException {
        ApiResponse<RoomRespone> response = new ApiResponse<>(
                "Add cusscess ","201 CREATED",roomService.add(roomRequest)
        );
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
    @PutMapping(value = "/update/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> updateRoom(@Valid @ModelAttribute RoomRequest roomRequest,@PathVariable Long id) throws IOException,ResourceNotFoundException {
        ApiResponse<RoomRespone> response = new ApiResponse<>(
                "update cusscess ","201 CREATED",roomService.update(roomRequest,id)
        );
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteRoom(@PathVariable Long id)throws ResourceNotFoundException {
        ApiResponse<RoomRespone> response = new ApiResponse<>(
                "delete cusscess ","201 CREATED",roomService.delete(id)
        );
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
    @GetMapping
    public ResponseEntity<?> getRooms(){
        ApiResponse<List<RoomRespone>> response = new ApiResponse<>(
                "get rooms","400",roomService.getListRoom()
        );
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
    @GetMapping("/status")
    public ResponseEntity<?> getRoomsStatus(){
        ApiResponse<List<RoomRespone>> response = new ApiResponse<>(
                "get rooms","400",roomService.getListRoomByStatusAvailble()
        );
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
    @GetMapping("/id")
    public ResponseEntity<?> getRoomById(@Valid @RequestParam Long id) throws ResourceNotFoundException {
        ApiResponse<RoomRespone> response = new ApiResponse<>(
                "get room by id","400",roomService.getRoomById(id)
        );
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
    @GetMapping("/status/clear")
    public ResponseEntity<?> getRoomsStatusClear(){
        ApiResponse<List<RoomRespone>> response = new ApiResponse<>(
                "get rooms","400",roomService.getListRoomByStatusClear()
        );
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
    @PostMapping("/status/cleartoavilble/{id}")
    public ResponseEntity<?> updateStatusClearToAvailable(@Valid @PathVariable Long id) throws ResourceNotFoundException {
        roomService.updateClearToAvailble(id);
        return new ResponseEntity<>("success", HttpStatus.OK);
    }
    @GetMapping("/status/curently")
    public ResponseEntity<?> getRoomsStatusCurently(){
        ApiResponse<List<RoomRespone>> response = new ApiResponse<>(
                "get rooms","400",roomService.getListRoomByStatusCurrentltTennat()
        );
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
    @GetMapping("/customer/{email}")
    public ResponseEntity<?> getRoomsByCustomerEmail(@Valid @PathVariable String email){
        ApiResponse<List<RoomRespone>> response = new ApiResponse<>(
                "get rooms","400",roomService.getListRoomByCustomerEmail(email)
        );
        return new ResponseEntity<>(response, HttpStatus.OK);
    }


}