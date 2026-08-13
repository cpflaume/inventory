-- Jurtenburg initiales Schema.
-- Multi-Mandant: jede fachliche Tabelle trägt depot_id.

create table depot (
    id          uuid primary key,
    name        varchar(255) not null,
    description text,
    created_at  timestamptz  not null
);

create table location (
    id                 uuid primary key,
    depot_id           uuid        not null references depot (id) on delete cascade,
    type               varchar(16) not null,
    label              varchar(255) not null,
    grid_rows          integer,
    grid_cols          integer,
    parent_location_id uuid        references location (id) on delete set null,
    cell_row           integer,
    cell_col           integer,
    created_at         timestamptz not null
);

create table item (
    id             uuid primary key,
    depot_id       uuid        not null references depot (id) on delete cascade,
    name           varchar(255) not null,
    category       varchar(255),
    quantity       integer     not null,
    parent_item_id uuid        references item (id) on delete set null,
    location_id    uuid        references location (id) on delete set null,
    cell_row       integer,
    cell_col       integer,
    condition_flag varchar(16) not null,
    note           text,
    created_at     timestamptz not null
);

create table kit (
    id          uuid primary key,
    depot_id    uuid        not null references depot (id) on delete cascade,
    name        varchar(255) not null,
    description text,
    created_at  timestamptz not null
);

create table kit_position (
    id              uuid primary key,
    kit_id          uuid        not null references kit (id) on delete cascade,
    label           varchar(255) not null,
    target_quantity integer     not null,
    item_id         uuid,
    position_index  integer
);

create table defect_report (
    id          uuid primary key,
    depot_id    uuid        not null references depot (id) on delete cascade,
    item_id     uuid,
    location_id uuid,
    title       varchar(255) not null,
    description text,
    severity    varchar(16) not null,
    status      varchar(16) not null,
    reporter    varchar(255),
    created_at  timestamptz not null,
    resolved_at timestamptz
);

create index idx_location_depot on location (depot_id);
create index idx_location_parent on location (parent_location_id);
create index idx_item_depot on item (depot_id);
create index idx_item_location on item (location_id);
create index idx_kit_depot on kit (depot_id);
create index idx_kit_position_kit on kit_position (kit_id);
create index idx_defect_depot on defect_report (depot_id);
