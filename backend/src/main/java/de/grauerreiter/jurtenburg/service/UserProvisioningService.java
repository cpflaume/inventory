package de.grauerreiter.jurtenburg.service;

import de.grauerreiter.jurtenburg.domain.AppUser;
import de.grauerreiter.jurtenburg.domain.AuthProvider;
import de.grauerreiter.jurtenburg.domain.UserGroup;
import de.grauerreiter.jurtenburg.domain.UserStatus;
import de.grauerreiter.jurtenburg.repo.AppUserRepository;
import de.grauerreiter.jurtenburg.repo.UserGroupRepository;
import java.util.Collection;
import java.util.HashSet;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Bereitstellung/Aktualisierung von Benutzern aus einem <em>externen</em> Identitätsprovider
 * (OIDC). Genau diese Naht macht „mehrere Auth-Provider" konkret: ein künftiger
 * OIDC-Callback verifiziert das IdP-Token und ruft {@link #provisionExternalUser} auf —
 * upsert des Benutzers + Synchronisierung der Gruppen aus den Claims. Danach stellt der
 * Aufrufer dasselbe App-JWT aus wie beim lokalen Login.
 *
 * <p>Die eigentliche OIDC-Token-Verifikation (JWKS) ist noch nicht verdrahtet; sie kommt als
 * eigener Controller/Filter dazu und nutzt diese Methode.</p>
 */
@Service
public class UserProvisioningService {

    private final AppUserRepository users;
    private final UserGroupRepository groups;

    public UserProvisioningService(AppUserRepository users, UserGroupRepository groups) {
        this.users = users;
        this.groups = groups;
    }

    /**
     * Upsert eines externen Benutzers und Abgleich seiner Gruppen-Mitgliedschaften auf die
     * per Claim gelieferten Gruppennamen.
     *
     * @param autoCreateGroups fehlende Gruppen anlegen (sonst nur vorhandene verknüpfen).
     */
    @Transactional
    public AppUser provisionExternalUser(AuthProvider provider, String externalId, String username,
            String email, String displayName, Collection<String> groupNames, boolean autoCreateGroups) {
        // Der Benutzername ist die E-Mail-Adresse (Login-Identität). Fehlt sie im Claim,
        // fällt auf den vom IdP gelieferten Namen zurück.
        String usernameBase = (email == null || email.isBlank()) ? username : email;
        AppUser user = users.findByProviderAndExternalId(provider, externalId).orElseGet(() -> {
            AppUser created = new AppUser(uniqueUsername(usernameBase), provider);
            created.setExternalId(externalId);
            // Extern authentifizierte Identitäten gelten als vom IdP freigegeben.
            created.setStatus(UserStatus.ACTIVE);
            return created;
        });
        user.setEmail(email);
        user.setDisplayName(displayName == null || displayName.isBlank() ? user.getUsername() : displayName);

        Set<UserGroup> resolved = new HashSet<>();
        for (String name : groupNames) {
            if (name == null || name.isBlank()) {
                continue;
            }
            groups.findByName(name).ifPresentOrElse(resolved::add, () -> {
                if (autoCreateGroups) {
                    resolved.add(groups.save(new UserGroup(name, "aus OIDC-Claim angelegt")));
                }
            });
        }
        // Mitgliedschaften exakt auf die Claim-Gruppen setzen (Entzug im IdP → Entzug hier).
        user.getGroups().clear();
        user.getGroups().addAll(resolved);
        return users.save(user);
    }

    private String uniqueUsername(String desired) {
        String base = (desired == null || desired.isBlank()) ? "user" : desired;
        String candidate = base;
        int i = 1;
        while (users.existsByUsername(candidate)) {
            candidate = base + "-" + i++;
        }
        return candidate;
    }
}
