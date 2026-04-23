package re.quanlykhachsan.Config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.modelmapper.ModelMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AppConfig {
    @Bean
    public ModelMapper modelMapper() {
        return new ModelMapper();
    }
    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI().info(new Info().title("hảo milo")
                .description("user swahgger")
                .contact(new Contact().name("hao đz ").email("vuvanhao034@gmail.com"))
                .version("1.0"));
    }
}
