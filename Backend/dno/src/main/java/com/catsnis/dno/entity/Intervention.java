package com.catsnis.dno.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.util.Date;
import jakarta.persistence.Table;

@Entity
@Table(name = "intervention")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Intervention {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "code_inter", nullable = false, unique = true)
    private String codeInter;

    @Column(name = "type_inter")    private String typeInter;
    @Column(name = "action_inter")  private String actionInter;
    @Column(name = "comment_inter") private String commentInter;

    @Column(name = "date_inter")
    @Temporal(TemporalType.TIMESTAMP)
    private Date dateInter;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    @Builder.Default
    @Column(name = "en_attente_maintenance")
    private Boolean enAttenteMaintenance = false;

    @ManyToOne(fetch = FetchType.EAGER) @JoinColumn(name = "region_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Region region;

    @ManyToOne(fetch = FetchType.EAGER) @JoinColumn(name = "district_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "region"})
    private District district;

    @ManyToOne(fetch = FetchType.EAGER) @JoinColumn(name = "health_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "district", "region"})
    private Health health;

    @ManyToOne(fetch = FetchType.EAGER) @JoinColumn(name = "deployment_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "items", "createdBy"})
    private Deployment deployment;

    @ManyToOne(fetch = FetchType.EAGER) @JoinColumn(name = "evaluation_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Evaluation evaluation;

    @ManyToOne(fetch = FetchType.EAGER) @JoinColumn(name = "types_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Types types;

    @ManyToOne(fetch = FetchType.EAGER) @JoinColumn(name = "apps_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Apps apps;

    @ManyToOne(fetch = FetchType.EAGER) @JoinColumn(name = "technician_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "password", "authorities", "post", "units", "partner"})
    private Person technician;

    @ManyToOne(fetch = FetchType.EAGER) @JoinColumn(name = "booklet_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "region", "district", "post", "status"})
    private Booklet booklet;

    @ManyToOne(fetch = FetchType.EAGER) @JoinColumn(name = "person_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "password", "authorities", "post", "units", "partner"})
    private Person person;
}