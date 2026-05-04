package re.quanlykhachsan.service.interfac;

import org.springframework.boot.context.config.ConfigDataResourceNotFoundException;
import org.springframework.stereotype.Service;
import re.quanlykhachsan.dto.request.CustomerRequest;
import re.quanlykhachsan.dto.request.Login;
import re.quanlykhachsan.dto.response.JwtRespone;
import re.quanlykhachsan.entity.Customer;
import re.quanlykhachsan.exception.DataConfickException;

@Service
public interface ICustomerService {
    Customer register(CustomerRequest request) throws DataConfickException;
    JwtRespone logi (Login login) ;
}
