package com.catsnis.dno.service;

import com.catsnis.dno.dto.DashboardStatsResponse;
import com.catsnis.dno.dto.DashboardStatsResponse.*;
import com.catsnis.dno.dto.MapStatsResponse;
import com.catsnis.dno.entity.Role;
import com.catsnis.dno.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final PersonRepository         personRepository;
    private final InterventionRepository   interventionRepository;
    private final DeploymentRepository     deploymentRepository;
    private final AcquisitionRepository    acquisitionRepository;
    private final HealthRepository         healthRepository;
    private final PartnerRepository        partnerRepository;
    private final RegionRepository         regionRepository;
    private final DeploymentItemRepository deploymentItemRepository;

    // ── Stats globales ────────────────────────────────────────────────────────
    @Override
    @Transactional(readOnly = true)
    public DashboardStatsResponse getStats() {
        long t0 = System.currentTimeMillis();

        long totalPersons       = personRepository.count();
        System.out.println("✅ persons: "       + (System.currentTimeMillis()-t0) + "ms"); t0 = System.currentTimeMillis();
        long totalTechniciens   = personRepository.countByRole(Role.TECHNICIEN);
        System.out.println("✅ techniciens: "   + (System.currentTimeMillis()-t0) + "ms"); t0 = System.currentTimeMillis();
        long totalInterventions = interventionRepository.count();
        System.out.println("✅ interventions: " + (System.currentTimeMillis()-t0) + "ms"); t0 = System.currentTimeMillis();
        long totalDeployments   = deploymentRepository.count();
        System.out.println("✅ deployments: "   + (System.currentTimeMillis()-t0) + "ms"); t0 = System.currentTimeMillis();
        long totalAcquisitions  = acquisitionRepository.count();
        System.out.println("✅ acquisitions: "  + (System.currentTimeMillis()-t0) + "ms"); t0 = System.currentTimeMillis();
        long totalHealthSites   = healthRepository.count();
        System.out.println("✅ healthSites: "   + (System.currentTimeMillis()-t0) + "ms"); t0 = System.currentTimeMillis();
        long totalPartners      = partnerRepository.count();
        System.out.println("✅ partners: "      + (System.currentTimeMillis()-t0) + "ms"); t0 = System.currentTimeMillis();
        long totalRegions       = regionRepository.count();
        System.out.println("✅ regions: "       + (System.currentTimeMillis()-t0) + "ms"); t0 = System.currentTimeMillis();
        long totalStock         = acquisitionRepository.countStock();
        System.out.println("✅ stock: "         + (System.currentTimeMillis()-t0) + "ms"); t0 = System.currentTimeMillis();

        var regionStats = buildRegionStats(null, null, null);
        System.out.println("✅ regionStats: "   + (System.currentTimeMillis()-t0) + "ms"); t0 = System.currentTimeMillis();
        var byMonth  = getInterventionsByMonthOptimized();
        System.out.println("✅ byMonth: "       + (System.currentTimeMillis()-t0) + "ms"); t0 = System.currentTimeMillis();
        var byRegion = buildLabelStats(deploymentRepository.countGroupByRegion(null, null, null));
        System.out.println("✅ byRegion: "      + (System.currentTimeMillis()-t0) + "ms"); t0 = System.currentTimeMillis();
        var byType   = buildLabelStats(interventionRepository.countGroupByType());
        System.out.println("✅ byType: "        + (System.currentTimeMillis()-t0) + "ms"); t0 = System.currentTimeMillis();
        var byRole   = getPersonsByRoleOptimized();
        System.out.println("✅ byRole: "        + (System.currentTimeMillis()-t0) + "ms"); t0 = System.currentTimeMillis();
        var recentInter = getRecentInterventions();
        System.out.println("✅ recentInter: "   + (System.currentTimeMillis()-t0) + "ms"); t0 = System.currentTimeMillis();
        var recentDep   = getRecentDeployments();
        System.out.println("✅ recentDep: "     + (System.currentTimeMillis()-t0) + "ms");

        return DashboardStatsResponse.builder()
                .totalPersons(totalPersons)
                .totalTechniciens(totalTechniciens)
                .totalInterventions(totalInterventions)
                .totalDeployments(totalDeployments)
                .totalAcquisitions(totalAcquisitions)
                .totalHealthSites(totalHealthSites)
                .totalPartners(totalPartners)
                .totalRegions(totalRegions)
                .totalStock(totalStock)
                .regionStats(regionStats)
                .interventionsByMonth(byMonth)
                .deploymentsByRegion(byRegion)
                .interventionsByType(byType)
                .personsByRole(byRole)
                .recentInterventions(recentInter)
                .recentDeployments(recentDep)
                .build();
    }

    // ── Stats carte ───────────────────────────────────────────────────────────
    @Override
    @Transactional(readOnly = true)
    public MapStatsResponse getMapStats(
            Integer regionId, Integer districtId, Integer healthId) {
        return MapStatsResponse.builder()
                .totalStock(acquisitionRepository.countStock())
                .regionStats(buildRegionStats(regionId, districtId, healthId))
                .build();
    }

    // ✅ 3 requêtes au lieu de 4 ───────────────────────────────────────────────
    private List<MapStatsResponse.RegionMapStat> buildRegionStats(
            Integer regionId, Integer districtId, Integer healthId) {

        // ✅ Une seule requête pour fonctionnel + non fonctionnel
        Map<String, Long> functionalMap    = new HashMap<>();
        Map<String, Long> nonFunctionalMap = new HashMap<>();

        List<Object[]> statusRows = deploymentItemRepository
                .countByStatusAndRegion(regionId, districtId, healthId);

        for (Object[] row : statusRows) {
            String region = (String) row[0];
            String status = (String) row[1];
            Long   count  = (Long)   row[2];
            if ("FONCTIONNEL".equals(status)) {
                functionalMap.put(region, count);
            } else if ("NON_FONCTIONNEL".equals(status)) {
                nonFunctionalMap.put(region, count);
            }
        }

        Map<String, Long> interventionsMap = toMap(
                interventionRepository.countGroupByRegion(regionId, districtId, healthId));
        Map<String, Long> deploymentsMap   = toMap(
                deploymentRepository.countGroupByRegion(regionId, districtId, healthId));

        Set<String> allRegions = new LinkedHashSet<>();
        allRegions.addAll(interventionsMap.keySet());
        allRegions.addAll(deploymentsMap.keySet());
        allRegions.addAll(functionalMap.keySet());
        allRegions.addAll(nonFunctionalMap.keySet());

        return allRegions.stream()
                .map(region -> MapStatsResponse.RegionMapStat.builder()
                        .label(region)
                        .interventions(interventionsMap.getOrDefault(region, 0L))
                        .deployments(deploymentsMap.getOrDefault(region, 0L))
                        .functional(functionalMap.getOrDefault(region, 0L))
                        .nonFunctional(nonFunctionalMap.getOrDefault(region, 0L))
                        .build())
                .collect(Collectors.toList());
    }

    // ✅ UNE seule requête pour les 12 mois ───────────────────────────────────
    private List<MonthStat> getInterventionsByMonthOptimized() {
        LocalDate now   = LocalDate.now();
        LocalDate start = now.minusMonths(11).withDayOfMonth(1);

        List<Object[]> rows = interventionRepository.countGroupByMonth(
                start.getYear(), start.getMonthValue(),
                now.getYear(),   now.getMonthValue()
        );

        Map<String, Long> countMap = new HashMap<>();
        for (Object[] row : rows) {
            String key = row[0] + "-" + String.format("%02d", row[1]);
            countMap.put(key, (Long) row[2]);
        }

        List<MonthStat> stats = new ArrayList<>();
        for (int i = 11; i >= 0; i--) {
            LocalDate month = now.minusMonths(i);
            String key      = month.getYear() + "-"
                    + String.format("%02d", month.getMonthValue());
            stats.add(MonthStat.builder()
                    .month(month.getMonth()
                            .getDisplayName(TextStyle.SHORT, Locale.FRENCH))
                    .count(countMap.getOrDefault(key, 0L))
                    .build());
        }
        return stats;
    }

    // ✅ UNE seule requête pour tous les rôles ────────────────────────────────
    private List<LabelStat> getPersonsByRoleOptimized() {
        Map<String, Long> roleMap = toMap(personRepository.countGroupByRole());
        return Arrays.stream(Role.values())
                .map(role -> LabelStat.builder()
                        .label(role.name())
                        .count(roleMap.getOrDefault(role.name(), 0L))
                        .build())
                .collect(Collectors.toList());
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private Map<String, Long> toMap(List<Object[]> rows) {
        Map<String, Long> map = new HashMap<>();
        for (Object[] row : rows) {
            if (row[0] != null) map.put(row[0].toString(), (Long) row[1]);
        }
        return map;
    }

    private List<LabelStat> buildLabelStats(List<Object[]> rows) {
        return rows.stream()
                .map(row -> LabelStat.builder()
                        .label((String) row[0])
                        .count((Long) row[1])
                        .build())
                .collect(Collectors.toList());
    }

    private List<RecentIntervention> getRecentInterventions() {
        return interventionRepository.findTop5ByOrderByDateInterDesc().stream()
                .map(i -> RecentIntervention.builder()
                        .id(i.getId())
                        .codeInter(i.getCodeInter())
                        .typeInter(i.getTypeInter())
                        .healthName(i.getHealth() != null
                                ? i.getHealth().getHealthName() : null)
                        .technicianName(i.getPerson() != null
                                ? i.getPerson().getFirstName() + " "
                                + i.getPerson().getLastName() : null)
                        .dateInter(i.getDateInter() != null
                                ? i.getDateInter().toString() : null)
                        .build())
                .collect(Collectors.toList());
    }

    private List<RecentDeployment> getRecentDeployments() {
        return deploymentRepository.findTop5ByOrderByDateRecepDesc().stream()
                .map(d -> RecentDeployment.builder()
                        .id(d.getId())
                        .codeDep(d.getCodeDep())
                        .healthName(d.getHealth() != null
                                ? d.getHealth().getHealthName() : null)
                        .regionName(d.getRegion() != null
                                ? d.getRegion().getRegionName() : null)
                        .dateRecep(d.getDateRecep() != null
                                ? d.getDateRecep().toString() : null)
                        .build())
                .collect(Collectors.toList());
    }
}