package re.quanlykhachsan.upload;

import jakarta.activation.DataSource;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import jakarta.mail.util.ByteArrayDataSource;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.FileSystemResource;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.util.FileCopyUtils;
import org.springframework.web.multipart.MultipartFile;

import re.quanlykhachsan.dto.response.EmailRespone;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class MailService {
    private final JavaMailSender sender;
    // gửi mail thông thường
    public void sendEmailNormal(String to, String subject, String content){
        SimpleMailMessage mailMessage = new SimpleMailMessage();
        mailMessage.setSubject(subject);
        mailMessage.setTo(to);
        mailMessage.setText(content);
        mailMessage.setFrom("Hunghx");
        sender.send(mailMessage);
    }
    // gửi nâng cao
    public void sendMailPro(String to, String subject, String content, File file ) throws MessagingException {
        MimeMessage message = sender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true);
        helper.setFrom("hunghx");
        helper.setTo(to);
        helper.setCc("maixuansang1123@gmail.com");
        helper.setSubject(subject);
        String htmlContent = "<h1 style=\"color:red\">hello Hùng</h1>" +
                "<p>"+content+"</p>";
        helper.setText(htmlContent,true);
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

        // 1. Đọc file index.html lên thành một chuỗi văn bản (String)
        ClassPathResource resource = new ClassPathResource("templates/index.html");
        byte[] bData = FileCopyUtils.copyToByteArray(resource.getInputStream());
        String htmlContent = new String(bData, StandardCharsets.UTF_8);

        // 2. CHỖ QUAN TRỌNG: Thực hiện thay thế ký tự tự định nghĩa
        // Lệnh này sẽ tìm chữ {{body}} trong file và đè nội dung biến body của bạn lên
        String finalHtml = htmlContent.replace("{{body}}", body);

        helper.setTo(to);
        helper.setSubject(subject);
        helper.setFrom("Hunghx <haovu1663@gmail.com>");

        // 3. Gửi nội dung đã được thay thế (finalHtml) chứ không phải htmlContent gốc
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