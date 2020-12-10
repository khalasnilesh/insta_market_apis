ALTER TABLE public.drivers
    ADD COLUMN is_deleted boolean DEFAULT False;

commit;