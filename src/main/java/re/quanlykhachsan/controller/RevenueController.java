package re.quanlykhachsan.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import re.quanlykhachsan.dto.response.RevenueStatDTO;
import re.quanlykhachsan.service.RevenueService;

import java.util.List;

@RestController
@RequestMapping("/api/v1/revenue")
@RequiredArgsConstructor
public class RevenueController {

    private final RevenueService revenueService;


    // Dùng cho biểu đồ - ngày cũ trước (ASC)
    @GetMapping("/by-day-chart")
    public ResponseEntity<List<RevenueStatDTO>> byDayChart() {
        return ResponseEntity.ok(revenueService.getRevenueByDayAsc());
    }

    // Dùng cho bảng - ngày mới trước (DESC)
    @GetMapping("/by-day")
    public ResponseEntity<List<RevenueStatDTO>> byDay() {
        return ResponseEntity.ok(revenueService.getRevenueByDay());
    }

    @GetMapping("/by-month")
    public ResponseEntity<List<RevenueStatDTO>> byMonth(@RequestParam int year) {
        return ResponseEntity.ok(revenueService.getRevenueByMonth(year));
    }

    @GetMapping("/by-quarter")
    public ResponseEntity<List<RevenueStatDTO>> byQuarter(@RequestParam int year) {
        return ResponseEntity.ok(revenueService.getRevenueByQuarter(year));
    }

    @GetMapping("/by-year")
    public ResponseEntity<List<RevenueStatDTO>> byYear() {
        return ResponseEntity.ok(revenueService.getRevenueByYear());
    }
}