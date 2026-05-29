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
        String token = getTokenFromRequest(request);

        // Không có token thì cho đi tiếp, không cần xác thực
        if (token == null) {
            filterChain.doFilter(request, response);
            return;
        }

        // Có token thì mới kiểm tra
        try {
            Jwts.parserBuilder()
                    .setSigningKey(jwtService.getJwtSecretKey())
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

        filterChain.doFilter(request, response);
    }

    public String getTokenFromRequest(HttpServletRequest request) {
        String authorization = request.getHeader("Authorization");
        if (authorization != null && authorization.startsWith("Bearer ")) {
            return authorization.substring(7);
        }
        return null;
    }
}