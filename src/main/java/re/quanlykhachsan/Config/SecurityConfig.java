package re.quanlykhachsan.Config;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import re.quanlykhachsan.Config.jwt.JwtAuthenticationFilter;
import re.quanlykhachsan.exception.JwtAuthenticationEntryPoint;

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
    @Autowired
    private JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;// xử lý trả về thông báo cụ thê
    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;
    // Tài khoản mặc định
//    @Bean
//    public UserDetailsService userDetailsService() {
//        // ADMIN
//        UserDetails admin = User.withUsername("admin123")// tai tài khoản
//                .password(passwordEncoder().encode("123456$"))// mật khẩu pahir đc mã hóa
//                .roles("ADMIN")//quyền
//                .build();
//        UserDetails user = User.withUsername("haomilo")
//                .password(passwordEncoder().encode("123456"))
//                .roles("USER")
//                .build();
//        UserDetails man = User.withUsername("manager01")
//                .password(passwordEncoder().encode("123456"))
//                .roles("MANAGER")
//                .build();
//        // lưu 3 tài khoản này vào ứng dụng . đưa vào vùng nhớ của sooring Security
//        return new InMemoryUserDetailsManager(admin, user, man);
//    }
    @Autowired
    private UserDetailsService userDetailsService; //thực chất là UserDetailCustom
    // thực hiện xác thực dựa trên userDetaiService và passWork encoder
    @Bean
    public AuthenticationProvider authenticationProvider() {
        // xác thực bằng các tai d liệu databasse để so khớp
        DaoAuthenticationProvider daoAuthenticationProvider = new DaoAuthenticationProvider(userDetailsService);
        // gải mã mất khẩu để so khơps
        daoAuthenticationProvider.setPasswordEncoder(passwordEncoder());
        return daoAuthenticationProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) {
        return config.getAuthenticationManager();
        // đây là phương thưc đăng nhập
    }

    // Tầng xác thực và phân quyền
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.cors(AbstractHttpConfigurer::disable)   // tắt cors // tìm hiểu thêm
                .csrf(AbstractHttpConfigurer::disable) // tắt csrf
                // phân quyền cho các API theo đường dẫn
                .authorizeHttpRequests(
                        req->
                                req     .requestMatchers("/api/v1/customer/login").permitAll()
                                        .requestMatchers("/api/v1/customer/register").permitAll()
                                        .requestMatchers("/api/v1/admin/**").hasAuthority("ADMIN") // admin ms đc truy cập api này
                                        .requestMatchers("/api/v1/user/**").hasAuthority("USER")//requestMatcher để so khớp kêt quả
                                        .requestMatchers("/api/v1/manager/**").hasAuthority("ROLE_MANAGER")
                                        .requestMatchers("/rooms/form").permitAll()
                                        .requestMatchers("/api/v1/roomtypes").permitAll()// the dùng hasAuthority("ROLE_MANAGER")
                                        .requestMatchers("/home").permitAll()

                                        .anyRequest().authenticated() // các api khác thì phải xác thực thì ms vào đc(đăng nhập)
                )
                // ✅ đăng ký EntryPoint ở đây
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(jwtAuthenticationEntryPoint)
                )
                // đăng ký authenticztionprovider
                .authenticationProvider(authenticationProvider())
                // thêm jwt vào security
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .sessionManagement(ss ->ss.sessionCreationPolicy(SessionCreationPolicy.STATELESS))// tắt lưu dữ liệu theo sesion
                // cơ chế dăng nhâp http basic
                // cơ chế dăng nhâp http basic
                .formLogin(Customizer.withDefaults())
                .httpBasic(Customizer.withDefaults()); // mặc đinh username pass : /login - POST
        return http.build();
    }
    //



}
