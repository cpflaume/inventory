import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import type { DepotRole, GroupSummary, UserSummary } from '../api/types';
import { Button, Card } from '../components/ui';

const ROLES: DepotRole[] = ['VIEWER', 'EDITOR', 'ADMIN'];

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-moos-800">🛠️ Admin-Konsole</h1>
        <Link to="/" className="text-sm font-semibold text-moos-700 underline">
          ← Zu den Lagern
        </Link>
      </div>
      <UsersSection />
      <GroupsSection />
      <AuditSection />
    </div>
  );
}

/** Navigations-Eintrag zur Audit-Log-Ansicht (nur für Admins erreichbar). */
function AuditSection() {
  return (
    <section className="space-y-3">
      <h2 className="font-semibold text-moos-700">Audit-Log</h2>
      <Link to="/admin/audit" className="block">
        <Card className="flex items-center gap-3 p-4 transition hover:ring-moos-300">
          <span className="text-2xl">📜</span>
          <div>
            <p className="font-semibold text-moos-800">Audit-Log ansehen</p>
            <p className="text-sm text-moos-500">
              Logins und alle Änderungen — wer wann was gemacht hat, filterbar.
            </p>
          </div>
          <span className="ml-auto text-moos-400">→</span>
        </Card>
      </Link>
    </section>
  );
}

function statusBadge(status: UserSummary['status']) {
  const map = {
    PENDING: 'bg-lagerfeuer-400/20 text-lagerfeuer-600',
    ACTIVE: 'bg-moos-100 text-moos-700',
    DISABLED: 'bg-red-100 text-red-700',
  } as const;
  return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${map[status]}`}>{status}</span>;
}

function DisplayNameEditor({
  user,
  pending,
  onSave,
}: {
  user: UserSummary;
  pending: boolean;
  onSave: (displayName: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(user.displayName ?? '');

  if (!editing) {
    return (
      <button
        onClick={() => {
          setDraft(user.displayName ?? '');
          setEditing(true);
        }}
        className="font-semibold text-moos-800 hover:underline"
        title="Anzeigenamen bearbeiten"
      >
        {user.displayName || user.email || user.username} ✏️
      </button>
    );
  }

  const save = () => {
    onSave(draft.trim());
    setEditing(false);
  };

  return (
    <span className="flex items-center gap-1">
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') save();
          if (e.key === 'Escape') setEditing(false);
        }}
        maxLength={100}
        placeholder="Anzeigename"
        className="rounded-lg border border-moos-200 px-2 py-0.5 text-sm"
      />
      <Button onClick={save} disabled={pending}>
        Speichern
      </Button>
      <Button variant="ghost" onClick={() => setEditing(false)}>
        Abbrechen
      </Button>
    </span>
  );
}

function UsersSection() {
  const qc = useQueryClient();
  const { user: me } = useAuth();
  const users = useQuery({ queryKey: ['admin-users'], queryFn: api.adminUsers });
  const groups = useQuery({ queryKey: ['admin-groups'], queryFn: api.adminGroups });
  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-users'] });

  const approve = useMutation({ mutationFn: api.approveUser, onSuccess: invalidate });
  const remove = useMutation({
    mutationFn: (u: UserSummary) => api.deleteUser(u.id),
    onSuccess: invalidate,
    onError: (e) => alert((e as Error).message),
  });
  const toggleAdmin = useMutation({
    mutationFn: (u: UserSummary) =>
      api.setSystemRole(u.id, u.systemRole === 'ADMIN' ? 'USER' : 'ADMIN'),
    onSuccess: invalidate,
    onError: (e) => alert((e as Error).message),
  });
  const toggleStatus = useMutation({
    mutationFn: (u: UserSummary) =>
      api.setUserStatus(u.id, u.status === 'DISABLED' ? 'ACTIVE' : 'DISABLED'),
    onSuccess: invalidate,
    onError: (e) => alert((e as Error).message),
  });
  const setDisplayName = useMutation({
    mutationFn: (v: { userId: string; displayName: string }) => api.setDisplayName(v.userId, v.displayName),
    onSuccess: invalidate,
    onError: (e) => alert((e as Error).message),
  });
  const addGroup = useMutation({
    mutationFn: (v: { userId: string; groupId: string }) => api.addUserToGroup(v.userId, v.groupId),
    onSuccess: invalidate,
  });
  const removeGroup = useMutation({
    mutationFn: (v: { userId: string; groupId: string }) => api.removeUserFromGroup(v.userId, v.groupId),
    onSuccess: invalidate,
  });

  return (
    <section className="space-y-3">
      <h2 className="font-semibold text-moos-700">Benutzer</h2>
      <div className="grid gap-3">
        {users.data?.map((u) => (
          <Card key={u.id} className="p-4">
            <div className="flex flex-wrap items-center gap-2">
              <DisplayNameEditor
                user={u}
                pending={setDisplayName.isPending}
                onSave={(displayName) => setDisplayName.mutate({ userId: u.id, displayName })}
              />
              <span className="text-xs text-moos-400">✉️ {u.email || u.username}</span>
              {statusBadge(u.status)}
              <span className="rounded-full bg-moos-50 px-2 py-0.5 text-xs text-moos-600">{u.provider}</span>
              {u.systemRole === 'ADMIN' && (
                <span className="rounded-full bg-moos-700 px-2 py-0.5 text-xs font-semibold text-white">ADMIN</span>
              )}
              <div className="ml-auto flex gap-2">
                {u.status === 'PENDING' && (
                  <Button onClick={() => approve.mutate(u.id)}>Freigeben</Button>
                )}
                {u.status !== 'PENDING' && (
                  <Button variant="ghost" onClick={() => toggleStatus.mutate(u)}>
                    {u.status === 'DISABLED' ? 'Entsperren' : 'Sperren'}
                  </Button>
                )}
                <Button variant="ghost" onClick={() => toggleAdmin.mutate(u)}>
                  {u.systemRole === 'ADMIN' ? 'Admin entziehen' : 'Zum Admin'}
                </Button>
                {u.id !== me?.id && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      if (window.confirm(`Benutzer „${u.displayName || u.email || u.username}" wirklich löschen?`)) {
                        remove.mutate(u);
                      }
                    }}
                  >
                    Löschen
                  </Button>
                )}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs text-moos-500">Gruppen:</span>
              {u.groups.length === 0 && <span className="text-xs text-moos-400">keine</span>}
              {u.groups.map((g) => (
                <button
                  key={g.id}
                  onClick={() => removeGroup.mutate({ userId: u.id, groupId: g.id })}
                  className="rounded-full bg-moos-100 px-2 py-0.5 text-xs text-moos-700 hover:bg-red-100 hover:text-red-700"
                  title="Aus Gruppe entfernen"
                >
                  {g.name} ✕
                </button>
              ))}
              <GroupPicker
                groups={groups.data ?? []}
                exclude={u.groups.map((g) => g.id)}
                onPick={(groupId) => addGroup.mutate({ userId: u.id, groupId })}
              />
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

function GroupPicker({
  groups,
  exclude,
  onPick,
}: {
  groups: GroupSummary[];
  exclude: string[];
  onPick: (groupId: string) => void;
}) {
  const options = groups.filter((g) => !exclude.includes(g.id));
  if (options.length === 0) return null;
  return (
    <select
      value=""
      onChange={(e) => e.target.value && onPick(e.target.value)}
      className="rounded-full border border-moos-200 px-2 py-0.5 text-xs text-moos-600"
    >
      <option value="">+ Gruppe …</option>
      {options.map((g) => (
        <option key={g.id} value={g.id}>
          {g.name}
        </option>
      ))}
    </select>
  );
}

function GroupsSection() {
  const qc = useQueryClient();
  const groups = useQuery({ queryKey: ['admin-groups'], queryFn: api.adminGroups });
  const [name, setName] = useState('');

  const create = useMutation({
    mutationFn: () => api.createGroup({ name }),
    onSuccess: () => {
      setName('');
      qc.invalidateQueries({ queryKey: ['admin-groups'] });
    },
  });
  const remove = useMutation({
    mutationFn: api.deleteGroup,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-groups'] }),
  });

  return (
    <section className="space-y-3">
      <h2 className="font-semibold text-moos-700">Gruppen → Lager</h2>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) create.mutate();
        }}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Neue Gruppe (z.B. Stamm-Team)"
          className="flex-1 rounded-xl border border-moos-200 px-4 py-2"
        />
        <Button type="submit" disabled={!name.trim() || create.isPending}>
          Anlegen
        </Button>
      </form>
      {create.isError && <p className="text-sm text-red-600">{(create.error as Error).message}</p>}
      <div className="grid gap-3">
        {groups.data?.map((g) => (
          <GroupCard key={g.id} group={g} onDelete={() => remove.mutate(g.id)} />
        ))}
      </div>
    </section>
  );
}

function GroupCard({ group, onDelete }: { group: GroupSummary; onDelete: () => void }) {
  const qc = useQueryClient();
  const depots = useQuery({ queryKey: ['depots'], queryFn: api.listDepots });
  const mappings = useQuery({
    queryKey: ['group-depots', group.id],
    queryFn: () => api.groupDepots(group.id),
  });
  const [depotId, setDepotId] = useState('');
  const [role, setRole] = useState<DepotRole>('EDITOR');
  const invalidate = () => qc.invalidateQueries({ queryKey: ['group-depots', group.id] });

  const map = useMutation({
    mutationFn: () => api.mapGroupDepot(group.id, { depotId, role }),
    onSuccess: () => {
      setDepotId('');
      invalidate();
    },
  });
  const unmap = useMutation({
    mutationFn: (dId: string) => api.unmapGroupDepot(group.id, dId),
    onSuccess: invalidate,
  });

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-moos-800">👥 {group.name}</span>
        <button onClick={onDelete} className="ml-auto text-xs text-red-500 hover:underline">
          Gruppe löschen
        </button>
      </div>
      <ul className="mt-2 space-y-1">
        {mappings.data?.length === 0 && <li className="text-sm text-moos-400">Noch keinem Lager zugeordnet.</li>}
        {mappings.data?.map((m) => (
          <li key={m.depotId} className="flex items-center gap-2 text-sm">
            <span className="rounded bg-moos-50 px-2 py-0.5">{m.depotName}</span>
            <span className="text-moos-500">→ {m.role}</span>
            <button onClick={() => unmap.mutate(m.depotId)} className="text-xs text-red-500 hover:underline">
              entfernen
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <select
          value={depotId}
          onChange={(e) => setDepotId(e.target.value)}
          className="rounded-xl border border-moos-200 px-3 py-1.5 text-sm"
        >
          <option value="">Lager wählen …</option>
          {depots.data?.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as DepotRole)}
          className="rounded-xl border border-moos-200 px-3 py-1.5 text-sm"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <Button variant="ghost" onClick={() => depotId && map.mutate()} disabled={!depotId || map.isPending}>
          + Zuordnen
        </Button>
      </div>
    </Card>
  );
}
