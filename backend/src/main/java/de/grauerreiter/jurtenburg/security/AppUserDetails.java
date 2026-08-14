package de.grauerreiter.jurtenburg.security;

import de.grauerreiter.jurtenburg.domain.AppUser;
import de.grauerreiter.jurtenburg.domain.SystemRole;
import de.grauerreiter.jurtenburg.domain.UserGroup;
import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

/**
 * Authentifizierter Principal. Trägt die IDs, die die Autorisierung braucht:
 * Benutzer-ID, Plattform-Rolle und die Gruppen-IDs (für die Lager-Zugriffsprüfung).
 */
public class AppUserDetails implements UserDetails {

    private final UUID userId;
    private final String username;
    private final SystemRole systemRole;
    private final Set<UUID> groupIds;

    public AppUserDetails(AppUser user) {
        this.userId = user.getId();
        this.username = user.getUsername();
        this.systemRole = user.getSystemRole();
        this.groupIds = user.getGroups().stream().map(UserGroup::getId).collect(Collectors.toSet());
    }

    public UUID getUserId() {
        return userId;
    }

    public SystemRole getSystemRole() {
        return systemRole;
    }

    public boolean isPlatformAdmin() {
        return systemRole == SystemRole.ADMIN;
    }

    public Set<UUID> getGroupIds() {
        return groupIds;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + systemRole.name()));
    }

    @Override
    public String getPassword() {
        return null;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
