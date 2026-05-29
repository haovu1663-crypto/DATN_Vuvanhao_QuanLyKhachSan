package re.quanlykhachsan.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import re.quanlykhachsan.dto.response.RevenueStatDTO;
import re.quanlykhachsan.repository.PaymentRespository;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RevenueService {

    private final PaymentRespository paymentRepository;

    // ASC - dùng cho biểu đồ (ngày cũ trước)
    public List<RevenueStatDTO> getRevenueByDayAsc() {
        return paymentRepository.revenueByDayNativeAsc()
                .stream()
                .map(row -> new RevenueStatDTO(
                        row[0].toString(),
                        ((Number) row[1]).doubleValue(),
                        ((Number) row[2]).longValue()
                )).toList();
    }

    // DESC - dùng cho bảng (ngày mới trước)
    public List<RevenueStatDTO> getRevenueByDay() {
        return paymentRepository.revenueByDayNative()
                .stream()
                .map(row -> new RevenueStatDTO(
                        row[0].toString(),
                        ((Number) row[1]).doubleValue(),
                        ((Number) row[2]).longValue()
                )).toList();
    }

    public List<RevenueStatDTO> getRevenueByMonth(int year) {
        List<Object[]> rows = paymentRepository.revenueByMonthInYearNative(year);
        return rows.stream().map(row -> new RevenueStatDTO(
                "Tháng " + row[0],
                ((Number) row[1]).doubleValue(),
                ((Number) row[2]).longValue()
        )).toList();
    }

    public List<RevenueStatDTO> getRevenueByQuarter(int year) {
        List<Object[]> rows = paymentRepository.revenueByQuarterInYearNative(year);
        return rows.stream().map(row -> new RevenueStatDTO(
                "Quý " + row[0],
                ((Number) row[1]).doubleValue(),
                ((Number) row[2]).longValue()
        )).toList();
    }

    public List<RevenueStatDTO> getRevenueByYear() {
        List<Object[]> rows = paymentRepository.revenueByYearNative();
        return rows.stream().map(row -> new RevenueStatDTO(
                "Năm " + row[0],
                ((Number) row[1]).doubleValue(),
                ((Number) row[2]).longValue()
        )).toList();
    }
}