alter table public.companies drop column delivery_chg_amount;
alter table public.companies drop column delivery_chg_radius;
alter table public.companies drop column delivery_chg_item_id;

alter table public.companies add column delivery_chg_radius character varying[] COLLATE pg_catalog."default";
alter table public.companies add column delivery_chg_amount character varying[] COLLATE pg_catalog."default";
alter table public.companies add column delivery_chg_item_id character varying[] COLLATE pg_catalog."default";

alter table public.units drop column delivery_chg_amount;
alter table public.units drop column delivery_radius;

alter table public.units add column delivery_chg_radius character varying[] COLLATE pg_catalog."default";
alter table public.units add column delivery_chg_amount character varying[] COLLATE pg_catalog."default";
alter table public.units add column delivery_chg_item_id character varying[] COLLATE pg_catalog."default";
