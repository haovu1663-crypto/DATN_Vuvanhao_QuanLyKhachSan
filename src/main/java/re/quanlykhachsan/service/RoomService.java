package re.quanlykhachsan.service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import re.quanlykhachsan.dto.request.RoomRequest;
import re.quanlykhachsan.dto.response.RoomRespone;
import re.quanlykhachsan.entity.Room;
import re.quanlykhachsan.entity.RoomType;
import re.quanlykhachsan.entity.StatusRoom;
import re.quanlykhachsan.exception.DataConfickException;
import re.quanlykhachsan.exception.ResourceNotFoundException;
import re.quanlykhachsan.repository.RoomRepository;
import re.quanlykhachsan.repository.RoomTypeRepository;
import re.quanlykhachsan.service.interfac.IRoomService;
import re.quanlykhachsan.service.interfac.IRoomTypeService;
import re.quanlykhachsan.upload.UploadService;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoomService implements IRoomService {
    private final RoomRepository roomRepository;
    private final RoomTypeRepository roomTypeRepository;
    private final ModelMapper modelMapper;
    private final UploadService uploadService;
    @Override
    public RoomRespone add(RoomRequest roomRequest) throws IOException, ResourceNotFoundException, DataConfickException {
        Room room = modelMapper.map(roomRequest, Room.class);
        RoomType roomType = roomTypeRepository.findById(roomRequest.getType_room_id()).orElseThrow(()->new ResourceNotFoundException("không tim thấy roomType có id :"+roomRequest.getType_room_id()));
        if (roomRepository.existsByNameAndWorkBranch(roomRequest.getName(),roomRequest.getWorkBranch())) {
            throw new DataConfickException("Phong "+roomRequest.getName() +"đã tồn tại ở chi nhánh "+roomRequest.getWorkBranch());
        }
        room.setRoomType(roomType);
        room.setWorkBranch(roomRequest.getWorkBranch());
        roomRepository.save(room);
        return modelMapper.map(room, RoomRespone.class);
    }

    @Override
    public RoomRespone update(RoomRequest roomRequest, Long id) throws IOException, ResourceNotFoundException {
        // Load phòng hiện tại từ DB — tránh modelMapper ghi đè id và dữ liệu cũ thành null
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Room có id: " + id));

        // Cập nhật các field cơ bản
        room.setName(roomRequest.getName());

        if (roomRequest.getStatus() != null) {
            room.setStatus(roomRequest.getStatus());
        }
        // Cập nhật RoomType
        RoomType roomType = roomTypeRepository.findById(roomRequest.getType_room_id())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy RoomType có id: " + roomRequest.getType_room_id()));
        room.setRoomType(roomType);

        if (roomRequest.getWorkBranch() != null && !roomRequest.getWorkBranch().isBlank()) {
            room.setWorkBranch(roomRequest.getWorkBranch());
        }

        roomRepository.save(room);
        RoomRespone respone = modelMapper.map(room, RoomRespone.class);
        respone.setType_room_id(room.getRoomType().getId());
        // ✅ Đảm bảo workBranch có trong response trả về
        respone.setWorkBranch(room.getWorkBranch());
        return respone;
    }

    @Override
    public RoomRespone delete(Long id) throws ResourceNotFoundException {
        Room room = roomRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy RoomType có id: " + id + " xóa thất bại"));;
        roomRepository.delete(room);
        return modelMapper.map(room, RoomRespone.class);
    }

    @Override
    @Transactional
    public List<RoomRespone> getListRoom() {
        List<Room> rooms = roomRepository.findAll();
        return rooms.stream().map(n ->modelMapper.map(n,RoomRespone.class)).collect(Collectors.toList());
    }


    @Override
    @Transactional
    public List<RoomRespone> getListRoomByStatusAvailble() {
        // Lấy danh sách các phòng có trạng thái AVAILABLE[cite: 2]
        List<Room> rooms = roomRepository.findByStatus(StatusRoom.AVAILABLE);

        return rooms.stream().map(room -> {
            // Map các field cơ bản (name, price, status)
            RoomRespone response = modelMapper.map(room, RoomRespone.class);

            // Trích xuất id từ RoomType của thực thể Room sang type_room_id của DTO[cite: 1, 2, 3]
            if (room.getRoomType() != null) {
                response.setType_room_id(room.getRoomType().getId());
            }

            return response;
        }).collect(Collectors.toList());
    }
    // update room khi có ng đăt phòng
    @Override
    public void upadteRoomCurrnetlyTenant(Long roomid) throws ResourceNotFoundException {
        Room room = roomRepository.findById(roomid).orElseThrow(()->new ResourceNotFoundException("không tìm thấy room"));
        room.setStatus(StatusRoom.CURRENTLY_TENANT);
        roomRepository.save(room);
    }

    @Override
    public RoomRespone getRoomById(Long id) throws ResourceNotFoundException {
        Room room = roomRepository.findById(id).orElseThrow(()->new ResourceNotFoundException("không tìm thấy phòng có id này"));
       RoomRespone roomRespone= modelMapper.map(room, RoomRespone.class);
       roomRespone.setType_room_id(room.getRoomType().getId());
        return roomRespone;
    }

    @Override
    public List<RoomRespone> getListRoomByStatusClear() {

        // Lấy danh sách các phòng có trạng thái AVAILABLE[cite: 2]
        List<Room> rooms = roomRepository.findByStatus(StatusRoom.CLEANING);

        return rooms.stream().map(room -> {
            // Map các field cơ bản (name, price, status)
            RoomRespone response = modelMapper.map(room, RoomRespone.class);

            // Trích xuất id từ RoomType của thực thể Room sang type_room_id của DTO[cite: 1, 2, 3]
            if (room.getRoomType() != null) {
                response.setType_room_id(room.getRoomType().getId());
            }

            return response;
        }).collect(Collectors.toList());
    }

    @Override
    public void updateClearToAvailble(Long roomid) throws ResourceNotFoundException {
        Room room = roomRepository.findById(roomid).orElseThrow(()->new ResourceNotFoundException("không tìm thấy room"));
        room.setStatus(StatusRoom.AVAILABLE);
        roomRepository.save(room);
    }

    @Override
    public List<RoomRespone> getListRoomByStatusCurrentltTennat() {
        // Lấy danh sách các phòng có trạng thái AVAILABLE[cite: 2]
        List<Room> rooms = roomRepository.findByStatus(StatusRoom.CURRENTLY_TENANT);

        return rooms.stream().map(room -> {
            // Map các field cơ bản (name, price, status)
            RoomRespone response = modelMapper.map(room, RoomRespone.class);

            // Trích xuất id từ RoomType của thực thể Room sang type_room_id của DTO[cite: 1, 2, 3]
            if (room.getRoomType() != null) {
                response.setType_room_id(room.getRoomType().getId());
            }

            return response;
        }).collect(Collectors.toList());
    }

    @Override
    public List<RoomRespone> getListRoomByCustomerEmail(String email) {
        List<Room> rooms = roomRepository.findRoomsByCustomerEmail(email);

        return rooms.stream().map(room -> {
            // Map các field cơ bản (name, price, status)
            RoomRespone response = modelMapper.map(room, RoomRespone.class);

            // Trích xuất id từ RoomType của thực thể Room sang type_room_id của DTO[cite: 1, 2, 3]
            if (room.getRoomType() != null) {
                response.setType_room_id(room.getRoomType().getId());
            }

            return response;
        }).collect(Collectors.toList());
    }
     public void updateStatusCurrentToChecked(Long roomId) throws ResourceNotFoundException {
        Room room = roomRepository.findById(roomId).orElseThrow(()->new ResourceNotFoundException("không c "));
        room.setStatus(StatusRoom.CHECKED);
        roomRepository.save(room);
     }

    @Override
    public List<RoomRespone> getListRoomByStatusCheckIn() {
        // Lấy danh sách các phòng có trạng thái AVAILABLE[cite: 2]
        List<Room> rooms = roomRepository.findByStatus(StatusRoom.CHECKED);

        return rooms.stream().map(room -> {
            // Map các field cơ bản (name, price, status)
            RoomRespone response = modelMapper.map(room, RoomRespone.class);

            // Trích xuất id từ RoomType của thực thể Room sang type_room_id của DTO[cite: 1, 2, 3]
            if (room.getRoomType() != null) {
                response.setType_room_id(room.getRoomType().getId());
            }

            return response;
        }).collect(Collectors.toList());
    }

    @Override
    public List<RoomRespone> getListRoomByCustomerEmailCheckedIn(String email) {
        List<Room> rooms;
        if (email.contains("@")) {
            rooms = roomRepository.findRoomsByCustomerEmailchecIn(email);
        } else {
            rooms = roomRepository.findCheckedRoomsByPhoneNumber(email);
        }
        return rooms.stream().map(room -> {
            // Map các field cơ bản (name, price, status)
            RoomRespone response = modelMapper.map(room, RoomRespone.class);

            // Trích xuất id từ RoomType của thực thể Room sang type_room_id của DTO[cite: 1, 2, 3]
            if (room.getRoomType() != null) {
                response.setType_room_id(room.getRoomType().getId());
            }

            return response;
        }).collect(Collectors.toList());
    }


}
