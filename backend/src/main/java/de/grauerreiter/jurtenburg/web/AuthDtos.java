package de.grauerreiter.jurtenburg.web;

import de.grauerreiter.jurtenburg.domain.AppUser;
import de.grauerreiter.jurtenburg.domain.AuthProvider;
import de.grauerreiter.jurtenburg.domain.DepotRole;
import de.grauerreiter.jurtenburg.domain.SystemRole;
import de.grauerreiter.jurtenburg.domain.UserGroup;
import de.grauerreiter.jurtenburg.domain.UserStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** DTOs für Auth (Registrierung/Login/Me) und die Admin-Konsole. */
public final class AuthDtos {

    private AuthDtos() {
    }

    // ---- Auth ----

    public record RegisterRequest(
            @NotBlank @Size(min = 3, max = 64) String username,
            @Email String email,
            String displayName,
            @NotBlank @Size(min = 8, max = 100) String password) {
    }

    public record LoginRequest(@NotBlank String username, @NotBlank String password) {
    }

    public record AuthResponse(String token, UserSummary user) {
    }

    public record GroupSummary(UUID id, String name, String description) {
        public static GroupSummary of(UserGroup g) {
            return new GroupSummary(g.getId(), g.getName(), g.getDescription());
        }
    }

    public record UserSummary(
            UUID id,
            String username,
            String email,
            String displayName,
            AuthProvider provider,
            UserStatus status,
            SystemRole systemRole,
            List<GroupSummary> groups,
            Instant createdAt) {
        public static UserSummary of(AppUser u) {
            return new UserSummary(u.getId(), u.getUsername(), u.getEmail(), u.getDisplayName(),
                    u.getProvider(), u.getStatus(), u.getSystemRole(),
                    u.getGroups().stream().map(GroupSummary::of).sorted(
                            java.util.Comparator.comparing(GroupSummary::name)).toList(),
                    u.getCreatedAt());
        }
    }

    /** Ein Lager, das der aktuelle Benutzer erreichen darf, inkl. seiner Rolle darin. */
    public record DepotAccess(UUID depotId, String depotName, DepotRole role) {
    }

    public record MeResponse(UserSummary user, List<DepotAccess> depots) {
    }

    // ---- Admin ----

    public record CreateGroupRequest(@NotBlank String name, String description) {
    }

    public record MapGroupDepotRequest(@NotNull UUID depotId, @NotNull DepotRole role) {
    }

    public record AssignGroupRequest(@NotNull UUID groupId) {
    }

    public record SetSystemRoleRequest(@NotNull SystemRole systemRole) {
    }

    public record SetUserStatusRequest(@NotNull UserStatus status) {
    }

    public record GroupDepotMapping(UUID depotId, String depotName, DepotRole role) {
    }
}
