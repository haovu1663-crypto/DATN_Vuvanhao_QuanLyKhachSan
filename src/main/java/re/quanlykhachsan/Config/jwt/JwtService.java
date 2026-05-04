package re.quanlykhachsan.Config.jwt;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

@Service
@Slf4j
public class JwtService {
    // lấy thông tin từ file application.properties
    @Value("${jwt.secret-key}")
    private String jwtSecret;
    @Value("${jwt.expired}")
    private Long expiredTime;
    // sinh jwwt
    // accesToKen : 15p
    public String generateAccessToken(String username) {
        return Jwts.builder()
                .setSubject(username) // mã hóa name vào chuôi jwt
               // .setPayload(userDetails.getAuthorities().toString()) // mã hóa quyền nhưng có thể không cần lắm
                .setIssuedAt(new Date())          // bắt đầu
                .setExpiration(new Date( new Date().getTime() + expiredTime))// time kết thưc
                .signWith(getJwtSecretKey(),SignatureAlgorithm.HS256) // chuỗi bý bận chuyên sang baser 64
                .compact();
    }
    // tạo key
    public Key getJwtSecretKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }
    //refreshToken : 7 ngày
    public String generateRefreshToken(String username) {
        return Jwts.builder()
                .setSubject(username) // mã hóa name vào chuôi jwt
                // .setPayload(userDetails.getAuthorities().toString()) // mã hóa quyền nhưng có thể không cần lắm
                .setIssuedAt(new Date())          // bắt đầu
                .setExpiration(new Date( new Date().getTime() + expiredTime*96*7))// time kết thưc
                .signWith(SignatureAlgorithm.HS256, getJwtSecretKey()) // chuỗi bý bận chuyên sang baser 64
                .compact();
    }
    // xác minh Token hợp lệ
    public boolean validateToken(String Token) {
        try {
           Jwts.parserBuilder()
                   .setSigningKey(getJwtSecretKey())
                   .build()
                   .parseClaimsJws(Token);
           return true;
        }
        catch (MalformedJwtException e)   {
            // token không đúng loại
            log.error("invalid Token",e.getMessage());
        }catch ( UnsupportedJwtException e) {
            // không hỗ trọ token này
            log.error("unsupported Token",e.getMessage());
        }catch ( ExpiredJwtException e) {
            /// token hết hạn
            log.error("expired Token",e.getMessage());
        }
        catch ( IllegalArgumentException e) {
             // đối số chuền vào ko hợp lệ  key hoăc token sai
            log.error("jwwt key String invalid",e.getMessage());
        }
        return false;
    }
    // giải mã token
    public String getUsernameFromToken(String token) {
       return Jwts.parserBuilder()
               .setSigningKey(getJwtSecretKey())
                .build()
                .parseClaimsJws(token).
               getBody().
               getSubject();
    }
}
