package com.catsnis.dno.config;

import com.catsnis.dno.entity.Person;
import com.catsnis.dno.entity.Role;
import com.catsnis.dno.repository.PersonRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements ApplicationRunner {

    private final PersonRepository personRepository;
    private final PasswordEncoder  passwordEncoder;

    @Value("${app.admin.email:superadmin@catusnis.ci}")
    private String adminEmail;

    @Value("${app.admin.password:SuperAdmin@2024}")
    private String adminPassword;

    @Override
    public void run(ApplicationArguments args) {
        if (!personRepository.existsByEmail(adminEmail)) {
            Person admin = Person.builder()
                    .firstName("Super")
                    .lastName("Admin")
                    .email(adminEmail)
                    .password(passwordEncoder.encode(adminPassword))
                    .role(Role.SUPER_ADMIN)
                    .build();
            personRepository.save(admin);
            log.info("✅ Compte SUPER_ADMIN créé : {}", adminEmail);
        } else {
            log.info("ℹ️  Compte {} déjà existant", adminEmail);
        }
    }
}