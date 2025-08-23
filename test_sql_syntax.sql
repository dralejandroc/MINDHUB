-- Test simple para validar sintaxis sin ejecutar cambios
DO $$
DECLARE
    test_tables text[] := ARRAY['test_table'];
    tbl_name text;
BEGIN
    FOREACH tbl_name IN ARRAY test_tables
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl_name) THEN
            RAISE NOTICE 'Tabla % existe', tbl_name;
        ELSE
            RAISE NOTICE 'Tabla % no existe', tbl_name;
        END IF;
    END LOOP;
END $$;