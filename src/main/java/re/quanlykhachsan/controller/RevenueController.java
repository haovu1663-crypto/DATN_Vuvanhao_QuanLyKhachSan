package re.quanlykhachsan.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import re.quanlykhachsan.dto.response.RevenueStatDTO;
import re.quanlykhachsan.service.RevenueExcelService;
import re.quanlykhachsan.service.RevenueService;

import java.io.File;
import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/revenue")
@RequiredArgsConstructor
public class RevenueController {

    private final RevenueService revenueService;
    private final RevenueExcelService revenueExcelService;

    // ==================== REVENUE STATISTICS ====================

    @GetMapping("/by-day-chart")
    public ResponseEntity<List<RevenueStatDTO>> byDayChart(
            @RequestParam(required = false, defaultValue = "") String branch) {
        return ResponseEntity.ok(revenueService.getRevenueByDayAsc(branch));
    }

    @GetMapping("/by-day")
    public ResponseEntity<List<RevenueStatDTO>> byDay(
            @RequestParam(required = false, defaultValue = "") String branch) {
        return ResponseEntity.ok(revenueService.getRevenueByDay(branch));
    }

    @GetMapping("/by-month")
    public ResponseEntity<List<RevenueStatDTO>> byMonth(
            @RequestParam int year,
            @RequestParam(required = false, defaultValue = "") String branch) {
        return ResponseEntity.ok(revenueService.getRevenueByMonth(year, branch));
    }

    @GetMapping("/by-quarter")
    public ResponseEntity<List<RevenueStatDTO>> byQuarter(
            @RequestParam int year,
            @RequestParam(required = false, defaultValue = "") String branch) {
        return ResponseEntity.ok(revenueService.getRevenueByQuarter(year, branch));
    }

    @GetMapping("/by-year")
    public ResponseEntity<List<RevenueStatDTO>> byYear(
            @RequestParam(required = false, defaultValue = "") String branch) {
        return ResponseEntity.ok(revenueService.getRevenueByYear(branch));
    }

    // ==================== EXPORT EXCEL ====================

    @GetMapping("/export-excel")
    public ResponseEntity<Resource> exportExcel(
            @RequestParam String type,
            @RequestParam(defaultValue = "0") int year,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo,
            @RequestParam(required = false, defaultValue = "") String branch
    ) {
        try {
            if (year == 0) year = java.time.Year.now().getValue();

            String filePath = revenueExcelService.exportRevenue(type, year, dateFrom, dateTo, branch);
            File file = new File(filePath);
            Resource resource = new FileSystemResource(file);

            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getName() + "\"")
                    .body(resource);

        } catch (IOException e) {
            return ResponseEntity.status(500).build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400).build();
        }
    }

    @GetMapping("/export-excel-all")
    public ResponseEntity<Resource> exportExcelAll(
            @RequestParam(defaultValue = "0") int year,
            @RequestParam(required = false, defaultValue = "") String branch
    ) {
        try {
            if (year == 0) year = java.time.Year.now().getValue();

            String filePath = revenueExcelService.exportRevenueAll(year, branch);
            File file = new File(filePath);
            Resource resource = new FileSystemResource(file);

            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getName() + "\"")
                    .body(resource);

        } catch (IOException e) {
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/export-status")
    public ResponseEntity<Map<String, Object>> exportStatus() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "ready");
        response.put("message", "Hệ thống sẵn sàng xuất Excel");
        return ResponseEntity.ok(response);
    }
}