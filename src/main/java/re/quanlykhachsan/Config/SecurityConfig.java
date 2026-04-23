package re.quanlykhachsan.Config;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
@Configuration
@EnableWebSecurity
// phân quyền theo phương thức
@EnableMethodSecurity
public class SecurityConfig {
    // Tạo cấu hình tùy chỉnh
    // Các tài khoản mặc định (username, password, ROLE)
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();  // mã hóa mật khẩu mảng băm
    }

    // Tài khoản mặc định
    @Bean
    public UserDetailsService userDetailsService() {
        // ADMIN
        UserDetails admin = User.withUsername("admin123")// tai tài khoản
                .password(passwordEncoder().encode("123456$"))// mật khẩu pahir đc mã hóa
                .roles("ADMIN")//quyền
                .build();
        UserDetails user = User.withUsername("haomilo")
                .password(passwordEncoder().encode("123456"))
                .roles("USER")
                .build();
        UserDetails man = User.withUsername("manager01")
                .password(passwordEncoder().encode("123456"))
                .roles("MANAGER")
                .build();
        // lưu 3 tài khoản này vào ứng dụng . đưa vào vùng nhớ của sooring Security
        return new InMemoryUserDetailsManager(admin, user, man);
    }

    // Tầng xác thực và phân quyền
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.cors(AbstractHttpConfigurer::disable)   // tắt cors // tìm hiểu thêm
                .csrf(AbstractHttpConfigurer::disable) // tắt csrf
                // phân quyền cho các API theo đường dẫn
                .authorizeHttpRequests(
                        req->
                                req.requestMatchers("/api/v1/admin/**").hasAuthority("ADMIN") // admin ms đc truy cập api này
                                        .requestMatchers("/api/v1/user/**").hasAuthority("USER")//requestMatcher để so khớp kêt quả
                                        .requestMatchers("/api/v1/manager/**").hasAuthority("ROLE_MANAGER")// the dùng hasAuthority("ROLE_MANAGER")
                                        .anyRequest().authenticated() // các api khác thì phải xác thực thì ms vào đc(đăng nhập)
                )
                // cơ chế dăng nhâp http basic
                .formLogin(Customizer.withDefaults())
                .httpBasic(Customizer.withDefaults()); // mặc đinh username pass : /login - POST
        return http.build();
    }
    //



}
