package com.catsnis.dno.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.util.Date;

@Entity
@Table(name = "acquisitions")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Acquisition {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String tag;
    private String serial;
    private Integer quantity;
    private String status;
    private String image;

    @Builder.Default
    private Boolean deployed = false;

    @Column(name = "date_acq")
    @Temporal(TemporalType.DATE)
    private Date dateAcq;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "types_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Types types;
}