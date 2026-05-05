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
    public RoomRespone add(RoomRequest roomRequest) throws IOException,ResourceNotFoundException {
        Room room = modelMapper.map(roomRequest, Room.class);
        List<MultipartFile> files = roomRequest.getImages();
        List<String> imageUrls = new ArrayList<>();
        for (MultipartFile file : files) {
            if (!file.isEmpty()) {
                String url = uploadService.uploadFile(file);
                imageUrls.add(url);
            }
        }
        RoomType roomType = roomTypeRepository.findById(roomRequest.getType_room_id()).orElseThrow(()->new ResourceNotFoundException("không tim thấy roomType có id :"+roomRequest.getType_room_id()));
        room.setRoomType(roomType);
        room.setImages(imageUrls);
        roomRepository.save(room);
        return modelMapper.map(room, RoomRespone.class);
    }

    @Override
    public RoomRespone update(RoomRequest roomRequest, Long id) throws IOException, ResourceNotFoundException {
       if(!roomRepository.existsById(id)){
                     throw  new ResourceNotFoundException("Không tim thấy Room có id : "+id+" update thất bai");
       }
        Room room = modelMapper.map(roomRequest, Room.class);
        List<MultipartFile> files = roomRequest.getImages();
        List<String> imageUrls = new ArrayList<>();
        for (MultipartFile file : files) {
            if (!file.isEmpty()) {
                String url = uploadService.uploadFile(file);
                imageUrls.add(url);
            }
        }
        RoomType roomType = roomTypeRepository.findById(roomRequest.getType_room_id()).orElseThrow(()->new ResourceNotFoundException("không tim thấy roomType có id :"+roomRequest.getType_room_id()));
        room.setRoomType(roomType);
        room.setImages(imageUrls);
        room.setId(id);
        roomRepository.save(room);
        return modelMapper.map(room, RoomRespone.class);
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
            response.setImages(room.getImages());
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
}
