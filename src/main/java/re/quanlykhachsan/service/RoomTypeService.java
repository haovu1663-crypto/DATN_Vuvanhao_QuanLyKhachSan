package re.quanlykhachsan.service;

import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.boot.context.config.ConfigDataNotFoundException;
import org.springframework.boot.context.config.ConfigDataResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import re.quanlykhachsan.dto.request.RoomTypeRequest;
import re.quanlykhachsan.dto.response.RoomTypeResponse;
import re.quanlykhachsan.entity.RoomType;
import re.quanlykhachsan.exception.DataConfickException;
import re.quanlykhachsan.exception.ResourceNotFoundException;
import re.quanlykhachsan.repository.RoomRepository;
import re.quanlykhachsan.repository.RoomTypeRepository;
import re.quanlykhachsan.service.interfac.IRoomTypeService;
import re.quanlykhachsan.upload.UploadService;

import java.io.IOException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoomTypeService implements IRoomTypeService {
    private final RoomTypeRepository roomTypeRepository;
    private final ModelMapper modelMapper;
    private final RoomRepository roomRepository;
    private final UploadService uploadService;
    public RoomTypeResponse add(RoomTypeRequest roomTypeRequest) throws IOException {
          RoomType roomType=modelMapper.map(roomTypeRequest,RoomType.class);
        List<MultipartFile> files = roomTypeRequest.getImages();
        List<String> imageUrls = new ArrayList<>();
        for (MultipartFile file : files) {
            if (!file.isEmpty()) {
                String url = uploadService.uploadFile(file);
                imageUrls.add(url);
            }
        }
        roomType.setImages(imageUrls);
          roomTypeRepository.save(roomType);
          return modelMapper.map(roomType,RoomTypeResponse.class);
    }
    public RoomTypeResponse update(RoomTypeRequest roomTypeRequest,Long id) throws ResourceNotFoundException, IOException {
        if(!roomTypeRepository.existsById(id)){
            throw new ResourceNotFoundException("không tìm thấy RoomType có id : "+id);
        }
        List<MultipartFile> files = roomTypeRequest.getImages();
        boolean hasNewImages = files != null && files.stream().anyMatch(f -> f != null && !f.isEmpty());
        List<String> imageUrls = new ArrayList<>();
        if (hasNewImages) {

            for (MultipartFile file : files) {
                if (file != null && !file.isEmpty()) {
                    imageUrls.add(uploadService.uploadFile(file));
                }
            }

        }

        RoomType roomType=modelMapper.map(roomTypeRequest,RoomType.class);
        roomType.setId(id);
        roomType.setImages(imageUrls);
        roomTypeRepository.save(roomType);
        return modelMapper.map(roomType,RoomTypeResponse.class);
    }
    public RoomTypeResponse delete(Long id) throws ResourceNotFoundException,DataConfickException {
        RoomType roomType = roomTypeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy RoomType có id: " + id + " xóa thất bại"));
        if(!roomTypeRepository.existsById(id)){
            throw new ResourceNotFoundException("không tìm thấy RoomType có id : "+id+" xóa thất bại");
        }
        if(roomRepository.existsByRoomTypeId(id)){
            throw new DataConfickException("không thể xóa đối tượng này ");
        }        roomTypeRepository.deleteById(id);
        return modelMapper.map(roomType,RoomTypeResponse.class);
    }
    public List<RoomTypeResponse> getListRoomType(){
         List<RoomType> roomTypeList=roomTypeRepository.findAll();
       return  roomTypeList.stream()
               .map(en -> modelMapper.map(en, RoomTypeResponse.class))
               .collect(Collectors.toList());
    }

    @Override
    public List<RoomTypeResponse> getListRoomTypeByWorkBrankAndCapacityAndDate(Integer capacity, String workBranch, LocalDate checIn, LocalDate checOut) throws IOException {
        List<RoomType> roomTypeList=roomTypeRepository.findAvailableRoomTypes(capacity,workBranch,checIn,checOut);
        return  roomTypeList.stream()
                .map(en -> modelMapper.map(en, RoomTypeResponse.class))
                .collect(Collectors.toList());
    }

    @Override
    public RoomTypeResponse getRoomTypeById(Long id) throws ResourceNotFoundException, IOException {
        RoomType roomType = roomTypeRepository.findById(id).orElseThrow(()-> new ResourceNotFoundException("không tìm thây RoomType có id : "+id));
        RoomTypeResponse roomTypeResponse=modelMapper.map(roomType,RoomTypeResponse.class);
        return roomTypeResponse;
    }
}
