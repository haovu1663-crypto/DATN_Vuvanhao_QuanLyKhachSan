package re.quanlykhachsan.service;

import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import re.quanlykhachsan.dto.request.ServiceRequest;
import re.quanlykhachsan.exception.ResourceNotFoundException;
import re.quanlykhachsan.repository.ServiceRepository;
import re.quanlykhachsan.service.interfac.IServiceService;
import re.quanlykhachsan.upload.UploadService;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ServiceService implements IServiceService {

    private final ServiceRepository serviceRepository;
    private final ModelMapper modelMapper;
    private final UploadService uploadService;

    @Override
    public String add(ServiceRequest request) throws IOException {
        try {
            re.quanlykhachsan.entity.Service service = modelMapper.map(request, re.quanlykhachsan.entity.Service.class);
            service.setImages(uploadImages(request.getImages()));
            serviceRepository.save(service);
            return "Thêm dịch vụ thành công";
        } catch (Exception e) {
            return "Thêm dịch vụ thất bại";
        }
    }

    @Override
    public String update(ServiceRequest request, Long id) throws ResourceNotFoundException, IOException {
        try {
            re.quanlykhachsan.entity.Service existing = serviceRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy dịch vụ có id: " + id));
            modelMapper.map(request, existing);
            existing.setId(id);
            List<MultipartFile> files = request.getImages();
            boolean hasNewImages = files != null && files.stream().anyMatch(f -> f != null && !f.isEmpty());
            if (hasNewImages) {
                existing.setImages(uploadImages(files));
            }
            serviceRepository.save(existing);
            return "Cập nhật dịch vụ thành công";
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            return "Cập nhật dịch vụ thất bại";
        }
    }

    @Override
    public String delete(Long id) throws ResourceNotFoundException {
        try {
            re.quanlykhachsan.entity.Service service = serviceRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy dịch vụ có id: " + id + ", xóa thất bại"));
            serviceRepository.deleteById(id);
            return "Xóa dịch vụ thành công";
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            return "Xóa dịch vụ thất bại";
        }
    }


    // ---- helper ----
    private List<String> uploadImages(List<MultipartFile> files) throws IOException {
        List<String> urls = new ArrayList<>();
        if (files == null) return urls;
        for (MultipartFile file : files) {
            if (file != null && !file.isEmpty()) {
                urls.add(uploadService.uploadFile(file));
            }
        }
        return urls;
    }
}