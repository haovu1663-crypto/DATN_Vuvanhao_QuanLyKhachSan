package re.quanlykhachsan.service;

import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.boot.context.config.ConfigDataResourceNotFoundException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import re.quanlykhachsan.Config.jwt.JwtService;
import re.quanlykhachsan.dto.request.CustomerRequest;
import re.quanlykhachsan.dto.request.Login;
import re.quanlykhachsan.dto.response.JwtRespone;
import re.quanlykhachsan.entity.Customer;
import re.quanlykhachsan.exception.DataConfickException;
import re.quanlykhachsan.repository.CustomerRespository;
import re.quanlykhachsan.service.interfac.ICustomerService;

import java.util.Date;

@Service
@RequiredArgsConstructor
public class CustomerService implements ICustomerService {
    private final CustomerRespository customerRespository;
    private final ModelMapper modelMapper;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    @Override
    public Customer register(CustomerRequest request) throws DataConfickException {
        Customer customer=modelMapper.map(request,Customer.class);
        customer.setPassword(passwordEncoder.encode(request.getPassword()));
        customer.setRole("ROLE_USER");
        if(customerRespository.existsByPhone(customer.getPhone())){
            throw  new DataConfickException("SDT này đã ton tại ");
        }
        if(customerRespository.existsByEmail(customer.getEmail())){
            throw  new DataConfickException("Emailnayfy đã được sử dụng ");
        }
        if (customerRespository.existsByUsername(customer.getUsername())) {
            throw  new DataConfickException("userName này đã được sử dụng ");
        }
        return customerRespository.save(customer);
    }

    @Override
    public JwtRespone logi(Login login) {

        Authentication authentication = null;
        try{
            // phương thức kiểm tra
            authentication=authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(login.getUsername(), login.getPassword()));
        }catch (Exception e){
            e.printStackTrace(); // ← thêm dòng này
            throw new RuntimeException("mk haoc tk sai ");
        }
        // trả vè jwtRespone
        Customer user = customerRespository.findByUsername(login.getUsername()).orElseThrow(()->new RuntimeException("ko tìm thấy "));
        JwtRespone res =  JwtRespone.builder()
                .userId(user.getId())
                .fullName(user.getFullname())
                .accessToken(jwtService.generateAccessToken(user.getUsername()))
                .expirationDate(new Date(new Date().getTime()+15*60*1000))
                .refreshToken(null)
                .build();
        return res;
    }

}
