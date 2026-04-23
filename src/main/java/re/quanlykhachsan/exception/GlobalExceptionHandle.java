package re.quanlykhachsan.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import re.quanlykhachsan.dto.response.ApiResponse;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandle {
    // vuale
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> handLerMethodNotArgumentException(MethodArgumentNotValidException e)
    {
        Map<String, String> errors = new HashMap<>();
        // lấy ra tên lỗi và put vào map
        e.getFieldErrors().forEach(error -> errors.put(error.getField(), error.getDefaultMessage()
        ));

        // bài tập bài 2 chứ ko pải là from mẫu
        ApiResponse<Map<String, String>> response = new ApiResponse<>(
                "400 BAD_REQUEST",
                "Dữ liệu không hợp lệ !",
                errors
        );
//           return new ResponseEntity<>(errors, HttpStatus.BAD_REQUEST);
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }
    // lỗi ko tìm thấy
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<?> handLerResourceNotFoundException(ResourceNotFoundException e)
    {
        Map<String, String> errors = new HashMap<>();
        // chúng ta tự đinh nghĩa lỗi nên sẽ thêm vào map luôn
        errors.put("id", e.getMessage());
        ApiResponse<Map<String, String>> response = new ApiResponse<>(
                "404 Not Found",
                "don't exist this opject !",
                errors
        );

        return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);//404
    }
    // lỗi xóa khóa ngoại
    @ExceptionHandler(ForeignKeyException.class)
    public ResponseEntity<?> handLerException(ForeignKeyException e)
    {
        Map<String, String> errors = new HashMap<>();
        errors.put("class", e.getMessage());
        ApiResponse<Map<String, String>> response = new ApiResponse<>(
                "400 Not Found",
                "This object cannot be deleted. !",
                errors
        );
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }
}
