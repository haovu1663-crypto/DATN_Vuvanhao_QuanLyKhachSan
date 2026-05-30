package re.quanlykhachsan.service.interfac;

import re.quanlykhachsan.dto.request.ServiceRequest;

import re.quanlykhachsan.exception.ResourceNotFoundException;

import java.io.IOException;
import java.util.List;

public interface IServiceService {

    String add(ServiceRequest request) throws IOException;

    String update(ServiceRequest request, Long id) throws ResourceNotFoundException, IOException;

    String delete(Long id) throws ResourceNotFoundException;

}