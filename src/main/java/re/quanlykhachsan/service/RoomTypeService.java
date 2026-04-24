package re.quanlykhachsan.service;

import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.boot.context.config.ConfigDataNotFoundException;
import org.springframework.boot.context.config.ConfigDataResourceNotFoundException;
import org.springframework.stereotype.Service;
import re.quanlykhachsan.dto.request.RoomTypeRequest;
import re.quanlykhachsan.dto.response.RoomTypeResponse;
import re.quanlykhachsan.entity.RoomType;
import re.quanlykhachsan.exception.DataConfickException;
import re.quanlykhachsan.exception.ResourceNotFoundException;
import re.quanlykhachsan.repository.RoomRepository;
import re.quanlykhachsan.repository.RoomTypeRepository;
import re.quanlykhachsan.service.interfac.IRoomTypeService;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoomTypeService implements IRoomTypeService {
    private final RoomTypeRepository roomTypeRepository;
    private final ModelMapper modelMapper;
    private final RoomRepository roomRepository;
    public RoomTypeResponse add(RoomTypeRequest roomTypeRequest){
          RoomType roomType=modelMapper.map(roomTypeRequest,RoomType.class);
          roomTypeRepository.save(roomType);
          return modelMapper.map(roomType,RoomTypeResponse.class);
    }
    public RoomTypeResponse update(RoomTypeRequest roomTypeRequest,Long id) throws ResourceNotFoundException {
        if(!roomTypeRepository.existsById(id)){
            throw new ResourceNotFoundException("không tìm thấy RoomType có id : "+id);
        }
        RoomType roomType=modelMapper.map(roomTypeRequest,RoomType.class);
        roomType.setId(id);
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
}
