package re.quanlykhachsan.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import re.quanlykhachsan.entity.RoomTypeDetail;
import re.quanlykhachsan.repository.RoomTypeDetailRepository;

@Service
@RequiredArgsConstructor
public class RoomTypeDetailService {
    private final RoomTypeDetailRepository roomTypeDetailRepository;
    @Transactional(readOnly = true)
    public RoomTypeDetail get(Long id){
        RoomTypeDetail roomTypeDetail= roomTypeDetailRepository.findByRoomTypeIdCustom(id);
        return roomTypeDetail;
    }
}