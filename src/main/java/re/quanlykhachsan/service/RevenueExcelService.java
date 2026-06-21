package re.quanlykhachsan.service;

import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import re.quanlykhachsan.dto.response.RevenueStatDTO;
import re.quanlykhachsan.repository.PaymentRespository;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RevenueExcelService {

    private final PaymentRespository paymentRepository;
    private final RevenueService revenueService;

    private static final String EXPORT_PATH = "D:\\DATN_VuVanHao\\thongke";

    /**
     * Xuất dữ liệu doanh thu theo loại (day/month/quarter/year)
     */
    public String exportRevenue(String type, int year, String dateFrom, String dateTo) throws IOException {
        List<RevenueStatDTO> data;

        switch (type.toLowerCase()) {
            case "day":
                data = revenueService.getRevenueByDay();
                break;
            case "month":
                data = revenueService.getRevenueByMonth(year);
                break;
            case "quarter":
                data = revenueService.getRevenueByQuarter(year);
                break;
            case "year":
                data = revenueService.getRevenueByYear();
                break;
            default:
                throw new IllegalArgumentException("Loại thống kê không hợp lệ: " + type);
        }

        // ✅ FIX 3: Dùng try-with-resources để đảm bảo workbook luôn được đóng
        String fileName = generateFileName(type);
        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Thống kê " + type);
            populateSheet(sheet, type, data, year, workbook);
            return saveWorkbook(workbook, fileName);
        }
    }

    /**
     * Xuất tất cả loại thống kê (ngày, tháng, quý, năm) vào các sheet khác nhau
     */
    public String exportRevenueAll(int year) throws IOException {
        if (year == 0) {
            year = java.time.Year.now().getValue();
        }

        String fileName = "ThongKe_Day_Month_Quarter_Year_" + year + ".xlsx";

        // ✅ FIX 3: Dùng try-with-resources
        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            // ========== SHEET 1: THEO NGÀY ==========
            List<RevenueStatDTO> dayData = revenueService.getRevenueByDay();
            Sheet daySheet = workbook.createSheet("Theo Ngày");
            populateSheet(daySheet, "day", dayData, year, workbook);

            // ========== SHEET 2: THEO THÁNG ==========
            List<RevenueStatDTO> monthData = revenueService.getRevenueByMonth(year);
            Sheet monthSheet = workbook.createSheet("Theo Tháng");
            populateSheet(monthSheet, "month", monthData, year, workbook);

            // ========== SHEET 3: THEO QUÝ ==========
            List<RevenueStatDTO> quarterData = revenueService.getRevenueByQuarter(year);
            Sheet quarterSheet = workbook.createSheet("Theo Quý");
            populateSheet(quarterSheet, "quarter", quarterData, year, workbook);

            // ========== SHEET 4: THEO NĂM ==========
            List<RevenueStatDTO> yearData = revenueService.getRevenueByYear();
            Sheet yearSheet = workbook.createSheet("Theo Năm");
            populateSheet(yearSheet, "year", yearData, year, workbook);

            // ========== SHEET 5: TỔNG HỢP ==========
            Sheet summarySheet = workbook.createSheet("Tổng Hợp");
            populateSummarySheet(summarySheet, year, workbook);

            return saveWorkbook(workbook, fileName);
        }
    }

    /**
     * Điền dữ liệu vào sheet
     */
    private void populateSheet(Sheet sheet, String type, List<RevenueStatDTO> data, int year, Workbook workbook) {
        CellStyle headerStyle   = createHeaderStyle(workbook);
        CellStyle dataStyle     = createDataStyle(workbook);
        CellStyle currencyStyle = createCurrencyStyle(workbook);
        CellStyle totalStyle    = createTotalStyle(workbook);

        // ========== TITLE ==========
        Row titleRow = sheet.createRow(0);
        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue("THỐNG KÊ DOANH THU " + type.toUpperCase());
        titleCell.setCellStyle(createTitleStyle(workbook));
        sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 4));

        // ========== SUBTITLE ==========
        Row subtitleRow = sheet.createRow(1);
        Cell subtitleCell = subtitleRow.createCell(0);
        subtitleCell.setCellValue(getSubtitleByType(type, year));
        subtitleCell.setCellStyle(createSubtitleStyle(workbook));
        sheet.addMergedRegion(new CellRangeAddress(1, 1, 0, 4));

        // ========== HEADER ROW ==========
        Row headerRow = sheet.createRow(3);
        String[] headers = {"Kỳ", "Doanh thu (₫)", "Số booking", "TB/booking (₫)", "% so với tổng"};
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }

        // ========== DATA ROWS ==========
        double totalRevenue = data.stream().mapToDouble(RevenueStatDTO::getTotalRevenue).sum();
        int rowNum = 4;

        for (RevenueStatDTO row : data) {
            Row dataRow = sheet.createRow(rowNum++);

            Cell cellLabel = dataRow.createCell(0);
            cellLabel.setCellValue(row.getLabel());
            cellLabel.setCellStyle(dataStyle);

            Cell cellRevenue = dataRow.createCell(1);
            cellRevenue.setCellValue(row.getTotalRevenue());
            cellRevenue.setCellStyle(currencyStyle);

            Cell cellBooking = dataRow.createCell(2);
            cellBooking.setCellValue(row.getTotalBooking());
            cellBooking.setCellStyle(dataStyle);

            Cell cellAvg = dataRow.createCell(3);
            double avg = row.getTotalBooking() > 0 ? row.getTotalRevenue() / row.getTotalBooking() : 0;
            cellAvg.setCellValue(avg);
            cellAvg.setCellStyle(currencyStyle);

            Cell cellPercent = dataRow.createCell(4);
            double percent = totalRevenue > 0 ? (row.getTotalRevenue() / totalRevenue) * 100 : 0;
            cellPercent.setCellValue(percent);
            cellPercent.setCellStyle(createPercentStyle(workbook));
        }

        // ========== TOTAL ROW ==========
        Row totalRow = sheet.createRow(rowNum + 1);

        Cell totalLabelCell = totalRow.createCell(0);
        totalLabelCell.setCellValue("TỔNG CỘNG");
        totalLabelCell.setCellStyle(totalStyle);

        Cell totalRevenueCell = totalRow.createCell(1);
        totalRevenueCell.setCellValue(totalRevenue);
        totalRevenueCell.setCellStyle(totalStyle);

        long totalBooking = data.stream().mapToLong(RevenueStatDTO::getTotalBooking).sum();
        Cell totalBookingCell = totalRow.createCell(2);
        totalBookingCell.setCellValue(totalBooking);
        totalBookingCell.setCellStyle(totalStyle);

        Cell totalAvgCell = totalRow.createCell(3);
        double totalAvg = totalBooking > 0 ? totalRevenue / totalBooking : 0;
        totalAvgCell.setCellValue(totalAvg);
        totalAvgCell.setCellStyle(totalStyle);

        Cell totalPercentCell = totalRow.createCell(4);
        totalPercentCell.setCellValue(100.0);
        totalPercentCell.setCellStyle(totalStyle);

        // ========== FORMAT COLUMNS ==========
        sheet.setColumnWidth(0, 20 * 256);
        sheet.setColumnWidth(1, 18 * 256);
        sheet.setColumnWidth(2, 15 * 256);
        sheet.setColumnWidth(3, 18 * 256);
        sheet.setColumnWidth(4, 15 * 256);

        // ========== FOOTER ==========
        Row footerRow = sheet.createRow(rowNum + 3);
        Cell footerCell = footerRow.createCell(0);
        SimpleDateFormat sdf = new SimpleDateFormat("dd/MM/yyyy HH:mm:ss");
        footerCell.setCellValue("Xuất lúc: " + sdf.format(new Date()));
        footerCell.setCellStyle(createFooterStyle(workbook));
    }

    /**
     * Tạo sheet tổng hợp thông tin
     */
    private void populateSummarySheet(Sheet sheet, int year, Workbook workbook) {
        CellStyle headerStyle = createHeaderStyle(workbook);
        CellStyle dataStyle   = createDataStyle(workbook);

        // Title
        Row titleRow = sheet.createRow(0);
        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue("TỔNG HỢP THỐNG KÊ DOANH THU - NĂM " + year);
        titleCell.setCellStyle(createTitleStyle(workbook));
        sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 2));

        int row = 2;

        Row monthRow = sheet.createRow(row++);
        Cell monthLabel = monthRow.createCell(0);
        monthLabel.setCellValue("Loại thống kê");
        monthLabel.setCellStyle(headerStyle);
        Cell monthValue = monthRow.createCell(1);
        monthValue.setCellValue("Năm: " + year);
        monthValue.setCellStyle(dataStyle);

        Row exportRow = sheet.createRow(row++);
        Cell exportLabel = exportRow.createCell(0);
        exportLabel.setCellValue("Ngày xuất");
        exportLabel.setCellStyle(headerStyle);
        Cell exportValue = exportRow.createCell(1);
        SimpleDateFormat sdf = new SimpleDateFormat("dd/MM/yyyy HH:mm:ss");
        exportValue.setCellValue(sdf.format(new Date()));
        exportValue.setCellStyle(dataStyle);

        row++;

        Row detailHeaderRow = sheet.createRow(row++);
        String[] detailHeaders = {"Loại", "Số kỳ", "Tổng doanh thu", "Tổng booking"};
        for (int i = 0; i < detailHeaders.length; i++) {
            Cell cell = detailHeaderRow.createCell(i);
            cell.setCellValue(detailHeaders[i]);
            cell.setCellStyle(headerStyle);
        }

        String[] types = {"Ngày", "Tháng", "Quý", "Năm"};
        for (String type : types) {
            Row detailRow = sheet.createRow(row++);
            detailRow.createCell(0).setCellValue(type);
        }

        sheet.setColumnWidth(0, 15 * 256);
        sheet.setColumnWidth(1, 20 * 256);
        sheet.setColumnWidth(2, 20 * 256);
        sheet.setColumnWidth(3, 15 * 256);
    }

    /**
     * Lưu workbook vào file
     * ✅ FIX 3: Bỏ workbook.close() — được quản lý bởi try-with-resources bên ngoài
     */
    private String saveWorkbook(XSSFWorkbook workbook, String fileName) throws IOException {
        File exportDir = new File(EXPORT_PATH);
        if (!exportDir.exists()) {
            exportDir.mkdirs();
        }

        String filePath = EXPORT_PATH + File.separator + fileName;
        try (FileOutputStream fos = new FileOutputStream(filePath)) {
            workbook.write(fos);
        }
        // KHÔNG gọi workbook.close() ở đây — try-with-resources bên ngoài sẽ tự đóng

        return filePath;
    }

    private String generateFileName(String type) {
        SimpleDateFormat sdf = new SimpleDateFormat("yyyyMMdd_HHmmss");
        return "ThongKe_" + type.toLowerCase() + "_" + sdf.format(new Date()) + ".xlsx";
    }

    private String getSubtitleByType(String type, int year) {
        return switch (type.toLowerCase()) {
            case "day"     -> "Thống kê theo ngày";
            case "month"   -> "Thống kê theo tháng - Năm " + year;
            case "quarter" -> "Thống kê theo quý - Năm " + year;
            case "year"    -> "Thống kê theo năm";
            default        -> "Thống kê doanh thu";
        };
    }

    // ========== STYLE METHODS ==========

    private CellStyle createTitleStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 16);
        font.setColor(IndexedColors.WHITE.getIndex());
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setWrapText(true);
        return style;
    }

    private CellStyle createSubtitleStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 11);
        font.setColor(IndexedColors.DARK_BLUE.getIndex());
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.LEFT);
        style.setFillForegroundColor(IndexedColors.LIGHT_BLUE.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        return style;
    }

    private CellStyle createHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setColor(IndexedColors.WHITE.getIndex());
        font.setFontHeightInPoints((short) 11);
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setFillForegroundColor(IndexedColors.DARK_GREEN.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        return style;
    }

    private CellStyle createDataStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setAlignment(HorizontalAlignment.LEFT);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        // ✅ FIX 4: Xóa setBorderColor() — API không hợp lệ trên interface CellStyle
        return style;
    }

    private CellStyle createCurrencyStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setAlignment(HorizontalAlignment.RIGHT);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setDataFormat(workbook.createDataFormat().getFormat("#,##0"));
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        // ✅ FIX 4: Xóa setBorderColor()
        return style;
    }

    private CellStyle createPercentStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setDataFormat(workbook.createDataFormat().getFormat("0.00\"%\""));
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        // ✅ FIX 4: Xóa setBorderColor()
        return style;
    }

    private CellStyle createTotalStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 11);
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.RIGHT);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setDataFormat(workbook.createDataFormat().getFormat("#,##0"));
        style.setFillForegroundColor(IndexedColors.LIGHT_GREEN.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setBorderBottom(BorderStyle.MEDIUM);
        style.setBorderLeft(BorderStyle.MEDIUM);
        style.setBorderRight(BorderStyle.MEDIUM);
        style.setBorderTop(BorderStyle.MEDIUM);
        return style;
    }

    private CellStyle createFooterStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setItalic(true);
        font.setFontHeightInPoints((short) 9);
        font.setColor(IndexedColors.GREY_40_PERCENT.getIndex());
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.RIGHT);
        return style;
    }
}