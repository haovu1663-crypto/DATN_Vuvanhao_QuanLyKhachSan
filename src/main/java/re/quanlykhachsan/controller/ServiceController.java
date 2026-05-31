package re.quanlykhachsan.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import re.quanlykhachsan.dto.request.ServiceRequest;
import re.quanlykhachsan.dto.response.ApiResponse;

import re.quanlykhachsan.exception.ResourceNotFoundException;
import re.quanlykhachsan.service.ServiceService;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/v1/services")
@RequiredArgsConstructor
public class ServiceController {

    private final ServiceService serviceService;

    // POST /api/v1/services/add
    @PostMapping(value = "/add", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> add(@Valid @ModelAttribute ServiceRequest request) throws IOException {
        ApiResponse<String> response = new ApiResponse<>(
                serviceService.add(request), "201 CREATED", null
        );
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    // PUT /api/v1/services/{id}
    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> update(
            @Valid @ModelAttribute ServiceRequest request,
            @PathVariable Long id) throws ResourceNotFoundException, IOException {
        ApiResponse<String> response = new ApiResponse<>(
                serviceService.update(request, id), "200 OK", null
        );
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    // DELETE /api/v1/services/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) throws ResourceNotFoundException {
        ApiResponse<String> response = new ApiResponse<>(
                serviceService.delete(id), "200 OK", null
        );
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
    @GetMapping("/{id}")
    public ResponseEntity<?> get(@PathVariable Long id) throws ResourceNotFoundException {
        return  new ResponseEntity<>(serviceService.getById(id), HttpStatus.OK);
    }
    @GetMapping()
    public ResponseEntity<?> get()  {
        return  new ResponseEntity<>(serviceService.getAllActive(), HttpStatus.OK);
    }
}