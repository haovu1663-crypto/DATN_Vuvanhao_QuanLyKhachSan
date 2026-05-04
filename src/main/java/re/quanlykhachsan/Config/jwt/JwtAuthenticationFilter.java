package re.quanlykhachsan.Config.jwt;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
      // chặn reqquest và lây token giai mã
        //lây token
        String token =getTokenFromRequest(request);
        // giải mã token

        try {
            // gọi thẳng parse ở đây thay vì dùng validateToken()
            Jwts.parserBuilder()
                    .setSigningKey(jwtService.getJwtSecretKey()) // cần public method này
                    .build()
                    .parseClaimsJws(token);

            String username = jwtService.getUsernameFromToken(token);
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);
            SecurityContextHolder.getContext().setAuthentication(
                    new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities()
                    )
            );
        } catch (ExpiredJwtException e) {
            request.setAttribute("jwt_error", "Token đã hết hạn");
        } catch (MalformedJwtException e) {
            request.setAttribute("jwt_error", "Token sai định dạng");
        } catch (UnsupportedJwtException e) {
            request.setAttribute("jwt_error", "Token không được hỗ trợ");
        } catch (Exception e) {
            request.setAttribute("jwt_error", "Token không hợp lệ");
        }
//            if (token != null && jwtService.validateToken(token)) {
//            // token hợp lệ rồi giải mã
//                String username = jwtService.getUsernameFromToken(token);
//            // load user từ database
//                UserDetails userDetails =userDetailsService.loadUserByUsername(username);
//            // lưu vào security context holder : userdetail , password(có thể null), danh sách quyền
//                SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities()));
//            }



        // cho request đi tiếp(có token hay không thì trương trình đêều đi tiêp )

        filterChain.doFilter(request, response);
    }



    // tạo hàm lấy reqest
    public String getTokenFromRequest(HttpServletRequest request) {
        // lấy phần header
        String authorization = request.getHeader("Authorization");
        // loại bỏ bearer
        if (authorization != null && authorization.startsWith("Bearer ")) {
            return authorization.substring(7);
        }
        return null;
    }

}
