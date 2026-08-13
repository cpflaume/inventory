-- Benutzerverwaltung + Mandantenfähigkeit (Gruppen → Lager).

create table app_user (
    id            uuid primary key,
    username      varchar(255) not null unique,
    email         varchar(255),
    display_name  varchar(255),
    provider      varchar(16)  not null,
    external_id   varchar(255),
    password_hash varchar(255),
    status        varchar(16)  not null,
    system_role   varchar(16)  not null,
    created_at    timestamptz  not null,
    approved_at   timestamptz
);

-- Externe Identitäten (OIDC) sind je Provider über ihre Subject-ID eindeutig.
create unique index uq_app_user_provider_external
    on app_user (provider, external_id)
    where external_id is not null;

create table user_group (
    id          uuid primary key,
    name        varchar(255) not null unique,
    description text,
    created_at  timestamptz  not null
);

create table user_group_membership (
    user_id  uuid not null references app_user (id) on delete cascade,
    group_id uuid not null references user_group (id) on delete cascade,
    primary key (user_id, group_id)
);

create table group_depot_access (
    id       uuid primary key,
    group_id uuid        not null references user_group (id) on delete cascade,
    depot_id uuid        not null references depot (id) on delete cascade,
    role     varchar(16) not null,
    unique (group_id, depot_id)
);

create index idx_group_depot_access_group on group_depot_access (group_id);
create index idx_group_depot_access_depot on group_depot_access (depot_id);
create index idx_membership_group on user_group_membership (group_id);
