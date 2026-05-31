package re.quanlykhachsan.service;

import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import re.quanlykhachsan.dto.request.ServiceRequest;

import re.quanlykhachsan.dto.response.ListProduct;
import re.quanlykhachsan.dto.response.ServiceRespone;
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
            service.setActive(true);
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
            existing.setActive(request.isActive());

            List<MultipartFile> files = request.getImages();
            boolean hasNewImages = files != null && files.stream().anyMatch(f -> f != null && !f.isEmpty());

            // Bắt đầu từ danh sách ảnh cũ cần giữ lại
            List<String> mergedImages = new ArrayList<>();
            if (request.getKeepImages() != null) {
                mergedImages.addAll(request.getKeepImages());
            }
            // Thêm ảnh mới upload vào sau
            if (hasNewImages) {
                mergedImages.addAll(uploadImages(files));
            }
            // Chỉ cập nhật nếu có thay đổi (upload mới hoặc xoá bớt)
            existing.setImages(mergedImages);
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

    @Override
    public ServiceRespone getById(Long id) throws ResourceNotFoundException {
        re.quanlykhachsan.entity.Service service = serviceRepository.findById(id).orElseThrow(()-> new ResourceNotFoundException("không tìm thấy service"));
        ServiceRespone serviceRequest = modelMapper.map(service, ServiceRespone.class);
        return serviceRequest;
    }

    @Override
    public List<ListProduct> getAllActive() {
        List<re.quanlykhachsan.entity.Service> services = serviceRepository.findAllActive();
        List<ListProduct> listProducts = services.stream().map(s->modelMapper.map(s, ListProduct.class)).collect(Collectors.toList());
        return listProducts;
    }
}