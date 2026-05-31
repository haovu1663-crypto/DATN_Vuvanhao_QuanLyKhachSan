package re.quanlykhachsan.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import re.quanlykhachsan.dto.request.OrderRequest;
import re.quanlykhachsan.service.OrderService;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {
   private final OrderService orderService;
    @PostMapping
    public ResponseEntity<?> saveOrder(@ModelAttribute OrderRequest order){
       return  new ResponseEntity<>(orderService.addOrder(order), HttpStatus.OK);
   }
}
