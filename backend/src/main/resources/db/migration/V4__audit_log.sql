-- Audit-Log: wer (Akteur) hat wann (occurred_at) was (action/method/path) gemacht.
-- Bewusst denormalisiert (actor_username, depot bleibt als ID) und ohne Fremdschlüssel
-- auf app_user: Audit-Einträge müssen auch das Löschen eines Benutzers überdauern.

create table audit_log (
    id             uuid primary key,
    occurred_at    timestamptz  not null,
    action         varchar(32)  not null,
    method         varchar(8),
    path           varchar(512),
    status_code    integer,
    actor_user_id  uuid,
    actor_username varchar(255),
    depot_id       uuid,
    ip_address     varchar(64)
);

-- Die Standardansicht sortiert nach Zeit (neueste zuerst); die übrigen Indizes
-- stützen die Filter der Audit-View (Akteur, Aktionstyp, Lager).
create index idx_audit_log_occurred_at on audit_log (occurred_at desc);
create index idx_audit_log_actor on audit_log (actor_username);
create index idx_audit_log_action on audit_log (action);
create index idx_audit_log_depot on audit_log (depot_id);
