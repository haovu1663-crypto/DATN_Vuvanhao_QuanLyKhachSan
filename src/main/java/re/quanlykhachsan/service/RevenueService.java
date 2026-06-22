package re.quanlykhachsan.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import re.quanlykhachsan.dto.response.RevenueStatDTO;
import re.quanlykhachsan.repository.PaymentRespository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RevenueService {

    private final PaymentRespository paymentRepository;

    // ── Không lọc branch (tất cả) ────────────────────────────────────────────

    public List<RevenueStatDTO> getRevenueByDayAsc() {
        return map(paymentRepository.revenueByDayNativeAsc());
    }

    public List<RevenueStatDTO> getRevenueByDay() {
        return map(paymentRepository.revenueByDayNative());
    }

    public List<RevenueStatDTO> getRevenueByMonth(int year) {
        return mapMonth(paymentRepository.revenueByMonthInYearNative(year));
    }

    public List<RevenueStatDTO> getRevenueByQuarter(int year) {
        return mapQuarter(paymentRepository.revenueByQuarterInYearNative(year));
    }

    public List<RevenueStatDTO> getRevenueByYear() {
        return mapYear(paymentRepository.revenueByYearNative());
    }

    // ── Có lọc branch ─────────────────────────────────────────────────────────

    public List<RevenueStatDTO> getRevenueByDayAsc(String branch) {
        if (branch == null || branch.isBlank()) return getRevenueByDayAsc();
        return map(paymentRepository.revenueByDayNativeAscBranch(branch));
    }

    public List<RevenueStatDTO> getRevenueByDay(String branch) {
        if (branch == null || branch.isBlank()) return getRevenueByDay();
        return map(paymentRepository.revenueByDayNativeBranch(branch));
    }

    public List<RevenueStatDTO> getRevenueByMonth(int year, String branch) {
        if (branch == null || branch.isBlank()) return getRevenueByMonth(year);
        return mapMonth(paymentRepository.revenueByMonthInYearNativeBranch(year, branch));
    }

    public List<RevenueStatDTO> getRevenueByQuarter(int year, String branch) {
        if (branch == null || branch.isBlank()) return getRevenueByQuarter(year);
        return mapQuarter(paymentRepository.revenueByQuarterInYearNativeBranch(year, branch));
    }

    public List<RevenueStatDTO> getRevenueByYear(String branch) {
        if (branch == null || branch.isBlank()) return getRevenueByYear();
        return mapYear(paymentRepository.revenueByYearNativeBranch(branch));
    }

    // ── Mapper helpers ────────────────────────────────────────────────────────

    private List<RevenueStatDTO> map(List<Object[]> rows) {
        return rows.stream().map(row -> new RevenueStatDTO(
                row[0].toString(),
                ((Number) row[1]).doubleValue(),
                ((Number) row[2]).longValue()
        )).toList();
    }

    private List<RevenueStatDTO> mapMonth(List<Object[]> rows) {
        return rows.stream().map(row -> new RevenueStatDTO(
                "Tháng " + row[0],
                ((Number) row[1]).doubleValue(),
                ((Number) row[2]).longValue()
        )).toList();
    }

    private List<RevenueStatDTO> mapQuarter(List<Object[]> rows) {
        return rows.stream().map(row -> new RevenueStatDTO(
                "Quý " + row[0],
                ((Number) row[1]).doubleValue(),
                ((Number) row[2]).longValue()
        )).toList();
    }

    private List<RevenueStatDTO> mapYear(List<Object[]> rows) {
        return rows.stream().map(row -> new RevenueStatDTO(
                "Năm " + row[0],
                ((Number) row[1]).doubleValue(),
                ((Number) row[2]).longValue()
        )).toList();
    }
}