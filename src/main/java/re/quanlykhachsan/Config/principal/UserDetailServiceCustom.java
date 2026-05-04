package re.quanlykhachsan.Config.principal;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import re.quanlykhachsan.entity.Customer;
import re.quanlykhachsan.entity.Employee;
import re.quanlykhachsan.repository.CustomerRespository;
import re.quanlykhachsan.repository.EmployeeRepository;


import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserDetailServiceCustom implements UserDetailsService {
    private final CustomerRespository  customerRespository;
    private final EmployeeRepository employeeRepository;

    // logic tải thông tin người dùng dựa trên user name
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
//       User user = userRespository.findByUsername(username).orElseThrow(()->new UsernameNotFoundException(username));
        Optional<Customer> user = customerRespository.findByUsername(username);
        // biến user thành UserDetail thì security mới có thể hiểu được
        // vì role la string nên cần biến đổi nó sang authority
        if(user.isPresent()) {
            List<GrantedAuthority> grantedAuthorities = new ArrayList<>();
            // biến đổi rồi thêm vào llist
            grantedAuthorities.add(new SimpleGrantedAuthority(user.get().getRole()));
            UserDetailCostum userDetailCostum = UserDetailCostum.builder()
                    .username(username)
                    .password(user.get().getPassword())
                    .authorities(grantedAuthorities)
                    .build();
            return userDetailCostum;
        }

        // nếu không có thì tìm trong bảng employees
        Employee employee = employeeRepository.findByUserName(username)
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy tài khoản: " + username));
        List<GrantedAuthority> authorities = List.of(
                new SimpleGrantedAuthority(employee.getRole())
        );
        return UserDetailCostum.builder()
                .username(username)
                .password(employee.getPassword())
                .authorities(authorities)
                .build();

    }
}
// can ghi đè phương thức của sercurity để xác thực tài khoản thông qua usrname