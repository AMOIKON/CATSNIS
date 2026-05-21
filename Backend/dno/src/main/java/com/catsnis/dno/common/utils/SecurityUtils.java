package com.catsnis.dno.common.utils;

import com.catsnis.dno.entity.Partner;
import com.catsnis.dno.entity.Person;
import com.catsnis.dno.entity.Role;
import com.catsnis.dno.repository.PersonRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@RequiredArgsConstructor
public class SecurityUtils {

    // ✅ ID ITECH-CIV en Integer pour correspondre au type Partner.getId()
    private static final int ITECH_PARTNER_ID = 17;

    private final PersonRepository personRepository;

    public Optional<Person> getCurrentUser() {
        String email = SecurityContextHolder.getContext()
                .getAuthentication().getName();
        return personRepository.findByEmail(email);
    }

    /**
     * Retourne :
     *  null  → pas de filtre (SUPER_ADMIN ou ITECH-CIV) → voit tout
     *  -1L   → filtre sur IS NULL (sans partenaire)
     *  X     → filtre sur partner_id = X
     */
    public Long getPartnerIdFilter() {
        Person user = getCurrentUser().orElse(null);
        if (user == null) return null;

        // SUPER_ADMIN → tout voir
        if (user.getRole() == Role.SUPER_ADMIN) return null;

        Partner partner = user.getPartner();

        // ✅ Partner.getId() est Integer — comparaison correcte avec ==
        if (partner != null && partner.getId() != null
                && partner.getId() == ITECH_PARTNER_ID) return null;

        // Avec partenaire → filtrer par son partenaire
        if (partner != null && partner.getId() != null)
            return partner.getId().longValue();

        // Sans partenaire → données orphelines uniquement
        return -1L;
    }

    public boolean isUnrestricted() {
        return getPartnerIdFilter() == null;
    }

    public boolean hasNoPartner() {
        Long f = getPartnerIdFilter();
        return f != null && f == -1L;
    }

    public Long getCurrentPartnerId() {
        Person user = getCurrentUser().orElse(null);
        if (user == null || user.getPartner() == null
                || user.getPartner().getId() == null) return null;
        return user.getPartner().getId().longValue();
    }

    public Person getCurrentUserOrThrow() {
        return getCurrentUser()
                .orElseThrow(() -> new RuntimeException("Utilisateur non authentifié"));
    }
}