package re.quanlykhachsan.Config.principal;

import lombok.Builder;
import org.jspecify.annotations.Nullable;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
// lớp này là lớp để tạo ra userdetail để sử lý trong userdetailService
@Builder
public class UserDetailCostum implements UserDetails {
    private String username;
    private String password;
    private List<GrantedAuthority> authorities;// list quyền
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public @Nullable String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return username;
    }
}
