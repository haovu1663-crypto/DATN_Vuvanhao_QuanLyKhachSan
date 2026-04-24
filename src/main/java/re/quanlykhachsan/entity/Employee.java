package re.quanlykhachsan.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Employee {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
     private String name;
    @Enumerated(EnumType.STRING)
     private Department department;
    @Column(unique = true)
    private String email;
    @Column(unique = true)
    private String phone;
    private double salary;
    @Column(unique = true)
    private String userName;
    private String password;
}
