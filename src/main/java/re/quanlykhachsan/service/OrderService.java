package re.quanlykhachsan.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import re.quanlykhachsan.dto.request.OrderRequest;
import re.quanlykhachsan.entity.Booking;
import re.quanlykhachsan.entity.Order;
import re.quanlykhachsan.repository.BookingRespository;
import re.quanlykhachsan.repository.OrderRepository;
import re.quanlykhachsan.repository.ServiceRepository;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderService {
    private final BookingRespository bookingRespository;
    private final ServiceRepository  serviceRepository;
    private final OrderRepository orderRepository;
    public String addOrder(OrderRequest request){
        Order order=new Order();
        order.setQuantity(request.getQuantity());
        Booking booking = bookingRespository.findById(request.getBookingId()).orElseThrow(null);
        order.setBooking(booking);
        re.quanlykhachsan.entity.Service service=serviceRepository.findById(request.getServiceId()).orElseThrow(null);
        order.setService(service);
        order.setAmount(request.getQuantity()*service.getPrice());
        order.setCreatedDate(LocalDateTime.now());
        orderRepository.save(order);
        return  "Đăt hàng thành công ";
    }
}
