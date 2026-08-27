package com.catsnis.dno.security;

import com.catsnis.dno.entity.Person;
import org.springframework.security.core.Authentication;

/**
 * NOUVEAU (27/08/2026) — restreint le verrouillage/deverrouillage de
 * l'application a UN SEUL compte precis, identifie par son email exact,
 * independamment du role SUPER_ADMIN des autres comptes. Meme un autre
 * compte SUPER_ADMIN ne peut pas verrouiller/deverrouiller ni voir le
 * sous-menu correspondant.
 *
 * Centralise ici pour n'avoir qu'un seul endroit a modifier si l'email
 * change un jour.
 */
public final class OwnerAccess {

    public static final String OWNER_EMAIL = "amoikonlouisfranck@gmail.com";

    private OwnerAccess() {
    }

    public static boolean isOwner(Person person) {
        return person != null && OWNER_EMAIL.equalsIgnoreCase(person.getEmail());
    }

    /**
     * Person implemente UserDetails et getUsername() retourne l'email —
     * Authentication.getName() retourne donc directement cet email pour
     * un principal de type UserDetails (voir AbstractAuthenticationToken).
     */
    public static boolean isOwner(Authentication authentication) {
        return authentication != null && OWNER_EMAIL.equalsIgnoreCase(authentication.getName());
    }
}