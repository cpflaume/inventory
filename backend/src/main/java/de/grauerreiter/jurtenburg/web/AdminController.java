package de.grauerreiter.jurtenburg.web;

import de.grauerreiter.jurtenburg.service.AdminService;
import de.grauerreiter.jurtenburg.web.AuthDtos.AssignGroupRequest;
import de.grauerreiter.jurtenburg.web.AuthDtos.CreateGroupRequest;
import de.grauerreiter.jurtenburg.web.AuthDtos.GroupDepotMapping;
import de.grauerreiter.jurtenburg.web.AuthDtos.GroupSummary;
import de.grauerreiter.jurtenburg.web.AuthDtos.MapGroupDepotRequest;
import de.grauerreiter.jurtenburg.web.AuthDtos.SetSystemRoleRequest;
import de.grauerreiter.jurtenburg.web.AuthDtos.UserSummary;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * Admin-Konsole. Der gesamte Pfad {@code /api/admin/**} ist in der SecurityConfig
 * auf die Plattform-Rolle ADMIN beschränkt.
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService admin;

    public AdminController(AdminService admin) {
        this.admin = admin;
    }

    // ---- Benutzer ----

    @GetMapping("/users")
    public List<UserSummary> users() {
        return admin.listUsers().stream().map(UserSummary::of).toList();
    }

    @PostMapping("/users/{userId}/approve")
    public UserSummary approve(@PathVariable UUID userId) {
        return UserSummary.of(admin.approveUser(userId));
    }

    @PostMapping("/users/{userId}/system-role")
    public UserSummary setSystemRole(@PathVariable UUID userId, @Valid @RequestBody SetSystemRoleRequest req) {
        return UserSummary.of(admin.setSystemRole(userId, req.systemRole()));
    }

    @PostMapping("/users/{userId}/groups")
    public UserSummary addGroup(@PathVariable UUID userId, @Valid @RequestBody AssignGroupRequest req) {
        return UserSummary.of(admin.addUserToGroup(userId, req.groupId()));
    }

    @DeleteMapping("/users/{userId}/groups/{groupId}")
    public UserSummary removeGroup(@PathVariable UUID userId, @PathVariable UUID groupId) {
        return UserSummary.of(admin.removeUserFromGroup(userId, groupId));
    }

    // ---- Gruppen ----

    @GetMapping("/groups")
    public List<GroupSummary> groups() {
        return admin.listGroups().stream().map(GroupSummary::of).toList();
    }

    @PostMapping("/groups")
    @ResponseStatus(HttpStatus.CREATED)
    public GroupSummary createGroup(@Valid @RequestBody CreateGroupRequest req) {
        return GroupSummary.of(admin.createGroup(req.name(), req.description()));
    }

    @DeleteMapping("/groups/{groupId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteGroup(@PathVariable UUID groupId) {
        admin.deleteGroup(groupId);
    }

    // ---- Gruppe → Lager ----

    @GetMapping("/groups/{groupId}/depots")
    public List<GroupDepotMapping> groupDepots(@PathVariable UUID groupId) {
        return admin.groupMappings(groupId);
    }

    @PostMapping("/groups/{groupId}/depots")
    public GroupDepotMapping mapDepot(@PathVariable UUID groupId, @Valid @RequestBody MapGroupDepotRequest req) {
        admin.mapGroupToDepot(groupId, req.depotId(), req.role());
        return new GroupDepotMapping(req.depotId(), admin.depotNameLookup().apply(req.depotId()), req.role());
    }

    @DeleteMapping("/groups/{groupId}/depots/{depotId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unmapDepot(@PathVariable UUID groupId, @PathVariable UUID depotId) {
        admin.unmapGroupFromDepot(groupId, depotId);
    }
}
