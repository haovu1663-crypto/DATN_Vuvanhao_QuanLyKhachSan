package re.quanlykhachsan.service;

import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import re.quanlykhachsan.dto.request.RoomRequest;
import re.quanlykhachsan.dto.response.RoomRespone;
import re.quanlykhachsan.entity.Room;
import re.quanlykhachsan.exception.ResourceNotFoundException;
import re.quanlykhachsan.repository.RoomRepository;
import re.quanlykhachsan.service.interfac.IRoomService;
import re.quanlykhachsan.upload.UploadService;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoomService implements IRoomService {
    private final RoomRepository roomRepository;
    private final ModelMapper modelMapper;
    private final UploadService uploadService;
    @Override
    public RoomRespone add(RoomRequest roomRequest) throws IOException {
        Room room = modelMapper.map(roomRequest, Room.class);
        List<MultipartFile> files = roomRequest.getImages();
        List<String> imageUrls = new ArrayList<>();
        for (MultipartFile file : files) {
            if (!file.isEmpty()) {
                String url = uploadService.uploadFile(file);
                imageUrls.add(url);
            }
        }
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
        room.setImages(imageUrls);
        roomRepository.save(room);
        return modelMapper.map(room, RoomRespone.class);
    }

    @Override
    public RoomRespone delete(Long id) throws ResourceNotFoundException {
        Room room = roomRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy RoomType có id: " + id + " xóa thất bại"));;
        return modelMapper.map(room, RoomRespone.class);
    }

    @Override
    public List<RoomRespone> getListRoom() {
        List<Room> rooms = roomRepository.findAll();
        return rooms.stream().map(n ->modelMapper.map(n,RoomRespone.class)).collect(Collectors.toList());
    }
}
