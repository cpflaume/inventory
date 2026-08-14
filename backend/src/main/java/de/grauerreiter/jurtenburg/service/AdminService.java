package de.grauerreiter.jurtenburg.service;

import de.grauerreiter.jurtenburg.domain.AppUser;
import de.grauerreiter.jurtenburg.domain.Depot;
import de.grauerreiter.jurtenburg.domain.DepotRole;
import de.grauerreiter.jurtenburg.domain.GroupDepotAccess;
import de.grauerreiter.jurtenburg.domain.SystemRole;
import de.grauerreiter.jurtenburg.domain.UserGroup;
import de.grauerreiter.jurtenburg.domain.UserStatus;
import de.grauerreiter.jurtenburg.repo.AppUserRepository;
import de.grauerreiter.jurtenburg.repo.DepotRepository;
import de.grauerreiter.jurtenburg.repo.GroupDepotAccessRepository;
import de.grauerreiter.jurtenburg.repo.UserGroupRepository;
import de.grauerreiter.jurtenburg.web.ApiExceptions.ConflictException;
import de.grauerreiter.jurtenburg.web.ApiExceptions.NotFoundException;
import de.grauerreiter.jurtenburg.web.AuthDtos.GroupDepotMapping;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Admin-Funktionen: Benutzer freigeben/verwalten, Gruppen anlegen, Benutzer Gruppen
 * zuordnen und Gruppen auf Lager mappen ("Gruppe X → Lager Y als Rolle").
 */
@Service
public class AdminService {

    private final AppUserRepository users;
    private final UserGroupRepository groups;
    private final GroupDepotAccessRepository accesses;
    private final DepotRepository depots;

    public AdminService(AppUserRepository users, UserGroupRepository groups,
            GroupDepotAccessRepository accesses, DepotRepository depots) {
        this.users = users;
        this.groups = groups;
        this.accesses = accesses;
        this.depots = depots;
    }

    // ---- Benutzer ----

    @Transactional(readOnly = true)
    public List<AppUser> listUsers() {
        return users.findAllByOrderByCreatedAtDesc();
    }

    @Transactional
    public AppUser approveUser(UUID userId) {
        AppUser user = user(userId);
        user.approve();
        return users.save(user);
    }

    @Transactional
    public AppUser setUserStatus(UUID userId, UserStatus status) {
        AppUser user = user(userId);
        if (status != UserStatus.ACTIVE) {
            assertNotLastActiveAdmin(user);
        }
        user.setStatus(status);
        return users.save(user);
    }

    @Transactional
    public AppUser setSystemRole(UUID userId, SystemRole role) {
        AppUser user = user(userId);
        if (role != SystemRole.ADMIN) {
            assertNotLastActiveAdmin(user);
        }
        user.setSystemRole(role);
        return users.save(user);
    }

    /** Blockt Änderungen, die den letzten aktiven Plattform-Admin entfernen würden. */
    private void assertNotLastActiveAdmin(AppUser user) {
        boolean isActiveAdmin = user.getSystemRole() == SystemRole.ADMIN && user.getStatus() == UserStatus.ACTIVE;
        if (isActiveAdmin
                && !users.existsBySystemRoleAndStatusAndIdNot(SystemRole.ADMIN, UserStatus.ACTIVE, user.getId())) {
            throw new ConflictException("Der letzte aktive Admin kann nicht entzogen oder gesperrt werden.");
        }
    }

    /**
     * Löscht einen Benutzer endgültig. Der letzte aktive Admin ist geschützt, und ein Admin
     * kann sein eigenes Konto nicht löschen. Gruppen-Mitgliedschaften werden per FK-Cascade
     * (ON DELETE CASCADE) mitentfernt.
     */
    @Transactional
    public void deleteUser(UUID actingUserId, UUID targetUserId) {
        if (java.util.Objects.equals(actingUserId, targetUserId)) {
            throw new ConflictException("Du kannst dein eigenes Konto nicht löschen.");
        }
        AppUser user = user(targetUserId);
        assertNotLastActiveAdmin(user);
        users.delete(user);
    }

    @Transactional
    public AppUser addUserToGroup(UUID userId, UUID groupId) {
        AppUser user = user(userId);
        user.getGroups().add(group(groupId));
        return users.save(user);
    }

    @Transactional
    public AppUser removeUserFromGroup(UUID userId, UUID groupId) {
        AppUser user = user(userId);
        user.getGroups().removeIf(g -> g.getId().equals(groupId));
        return users.save(user);
    }

    // ---- Gruppen ----

    @Transactional(readOnly = true)
    public List<UserGroup> listGroups() {
        return groups.findAllByOrderByNameAsc();
    }

    @Transactional
    public UserGroup createGroup(String name, String description) {
        if (groups.existsByName(name)) {
            throw new ConflictException("Gruppe existiert bereits: " + name);
        }
        return groups.save(new UserGroup(name, description));
    }

    @Transactional
    public void deleteGroup(UUID groupId) {
        UserGroup g = group(groupId);
        // Mitgliedschaften lösen und Lager-Mappings der Gruppe entfernen.
        for (AppUser u : users.findAll()) {
            if (u.getGroups().removeIf(x -> x.getId().equals(groupId))) {
                users.save(u);
            }
        }
        accesses.deleteAll(accesses.findByGroupId(groupId));
        groups.delete(g);
    }

    // ---- Gruppe → Lager ----

    @Transactional
    public GroupDepotAccess mapGroupToDepot(UUID groupId, UUID depotId, DepotRole role) {
        group(groupId);
        if (!depots.existsById(depotId)) {
            throw new NotFoundException("Lager nicht gefunden: " + depotId);
        }
        GroupDepotAccess access = accesses.findByGroupIdAndDepotId(groupId, depotId)
                .orElseGet(() -> new GroupDepotAccess(groupId, depotId, role));
        access.setRole(role);
        return accesses.save(access);
    }

    @Transactional
    public void unmapGroupFromDepot(UUID groupId, UUID depotId) {
        accesses.findByGroupIdAndDepotId(groupId, depotId).ifPresent(accesses::delete);
    }

    @Transactional(readOnly = true)
    public List<GroupDepotMapping> groupMappings(UUID groupId) {
        group(groupId);
        Map<UUID, String> depotNames = depots.findAll().stream()
                .collect(Collectors.toMap(Depot::getId, Depot::getName));
        return accesses.findByGroupId(groupId).stream()
                .map(a -> new GroupDepotMapping(a.getDepotId(),
                        depotNames.getOrDefault(a.getDepotId(), "?"), a.getRole()))
                .toList();
    }

    // ---- Helfer ----

    private AppUser user(UUID id) {
        return users.findById(id).orElseThrow(() -> new NotFoundException("Benutzer nicht gefunden: " + id));
    }

    private UserGroup group(UUID id) {
        return groups.findById(id).orElseThrow(() -> new NotFoundException("Gruppe nicht gefunden: " + id));
    }

    /** Kleiner Helfer, damit Controller Gruppen-Maps ohne N+1 aufbauen können. */
    public Function<UUID, String> depotNameLookup() {
        Map<UUID, String> names = depots.findAll().stream()
                .collect(Collectors.toMap(Depot::getId, Depot::getName));
        return id -> names.getOrDefault(id, "?");
    }
}
