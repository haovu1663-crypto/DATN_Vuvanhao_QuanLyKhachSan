package re.quanlykhachsan.upload;

import jakarta.activation.DataSource;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import jakarta.mail.util.ByteArrayDataSource;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.util.FileCopyUtils;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import re.quanlykhachsan.dto.response.EmailRespone;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MailService {
    private final JavaMailSender sender;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${brevo.api-key}")
    private String brevoApiKey;

    @Value("${brevo.sender-email}")
    private String brevoSenderEmail;

    @Value("${brevo.sender-name:Khach San}")
    private String brevoSenderName;

    // ===== GỬI MAIL QUA BREVO API (HTTPS) - dùng cho OTP, không bị chặn port =====
    public void sendEmailViaBrevo(String to, String subject, String htmlContent) {
        String url = "https://api.brevo.com/v3/smtp/email";

        HttpHeaders headers = new HttpHeaders();
        headers.set("api-key", brevoApiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("accept", "application/json");

        Map<String, Object> sender = new HashMap<>();
        sender.put("name", brevoSenderName);
        sender.put("email", brevoSenderEmail);

        Map<String, String> recipient = new HashMap<>();
        recipient.put("email", to);

        Map<String, Object> body = new HashMap<>();
        body.put("sender", sender);
        body.put("to", List.of(recipient));
        body.put("subject", subject);
        body.put("htmlContent", htmlContent);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        try {
            restTemplate.postForEntity(url, request, String.class);
        } catch (Exception e) {
            throw new RuntimeException("Gửi mail qua Brevo thất bại: " + e.getMessage(), e);
        }
    }

    // gửi mail thông thường - giữ lại bản SMTP cũ (phòng khi chạy local/server khác không bị chặn port)
    public void sendEmailNormal(String to, String subject, String content){
        // Đổi sang Brevo API để tránh lỗi bị chặn port SMTP trên Railway
        String htmlContent = "<p>" + content + "</p>";
        sendEmailViaBrevo(to, subject, htmlContent);
    }

    // gửi nâng cao
    public void sendMailPro(String to, String subject, String content, File file ) throws MessagingException {
        MimeMessage message = sender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true);
        helper.setFrom("hunghx");
        helper.setTo(to);
        helper.setCc("maixuansang1123@gmail.com");
        helper.setSubject(subject);
        String htmlContentMsg = "<h1 style=\"color:red\">hello Hùng</h1>" +
                "<p>"+content+"</p>";
        helper.setText(htmlContentMsg,true);
        // gửi file
        String fileName = file.getName();
        FileSystemResource resource = new FileSystemResource(file);
        helper.addAttachment(fileName,resource);
        sender.send(message);
    }
    public void sendMailVip(FormRequest request) throws MessagingException, IOException {
        MimeMessage message = sender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true);
        helper.setTo(request.getEmail());
        helper.setCc(request.getCc());
        helper.setSubject(request.getSubject());
        String htmlContent = "<h1 style=\"color:red\">hello "+request.getEmail()+"</h1>" +
                "<p>"+request.getContent()+"</p>";
        helper.setText(htmlContent,true);
        // gửi file
        for (MultipartFile file : request.getFile()){
            String fileName = file.getName();
            DataSource dataSource = new ByteArrayDataSource(file.getBytes(),file.getContentType());
            helper.addAttachment(fileName,dataSource);
        }
        sender.send(message);
    }
    public void sendHtmlFromTemplate(String to, String subject, String body) throws MessagingException, IOException {
        MimeMessage message = sender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        ClassPathResource resource = new ClassPathResource("templates/index.html");
        byte[] bData = FileCopyUtils.copyToByteArray(resource.getInputStream());
        String htmlContent = new String(bData, StandardCharsets.UTF_8);

        String finalHtml = htmlContent.replace("{{body}}", body);

        helper.setTo(to);
        helper.setSubject(subject);
        helper.setFrom("Hunghx <haovu1663@gmail.com>");

        helper.setText(finalHtml, true);

        sender.send(message);
    }

    public void sendBookingConfirmation(String to, EmailRespone emailRespone) throws MessagingException, IOException {
        MimeMessage message = sender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        ClassPathResource resource = new ClassPathResource("templates/booking-confirmation.html");
        byte[] bData = FileCopyUtils.copyToByteArray(resource.getInputStream());
        String htmlContent = new String(bData, StandardCharsets.UTF_8);

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

        htmlContent = htmlContent
                .replace("{{customerName}}", emailRespone.getNameCutomer() != null ? emailRespone.getNameCutomer() : "")
                .replace("{{nameRoom}}", emailRespone.getNameRoom() != null ? emailRespone.getNameRoom() : "")
                .replace("{{workBranch}}", emailRespone.getWorkBranch() != null ? emailRespone.getWorkBranch() : "")
                .replace("{{checkInDate}}", emailRespone.getCheckInEnventDate() != null
                        ? emailRespone.getCheckInEnventDate().format(formatter) : "")
                .replace("{{checkOutDate}}", emailRespone.getCheckOutEnventDate() != null
                        ? emailRespone.getCheckOutEnventDate().format(formatter) : "")
                .replace("{{createDate}}", emailRespone.getCreate() != null
                        ? emailRespone.getCreate().format(formatter) : "")
                .replace("{{price}}", emailRespone.getPrice() != null
                        ? String.format("%,.0f", emailRespone.getPrice()) : "0")
                .replace("{{body}}", emailRespone.getBody() != null ? emailRespone.getBody() : "");

        helper.setTo(to);
        helper.setSubject("✅ Xác nhận đặt phòng – " + emailRespone.getNameRoom());
        helper.setFrom("Khách Sạn <haovu1663@gmail.com>");
        helper.setText(htmlContent, true);

        sender.send(message);
    }
}