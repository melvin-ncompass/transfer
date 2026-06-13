import sys
import psycopg2
from psycopg2 import sql

# ========== CONFIGURATION ==========
DB_CONN = {
    "host": "localhost",
    "dbname": "data_postgres",
    "user": "postgres",
    "password": "XXXXX",
    "port": 5000
}

# table names (adjust if needed)
TABLE_A = "biz_computed_kajiado_master_health_facilities"
TABLE_C = "biz_raw_prompts"
TABLE_D = "biz_raw_prompts_intent_category"
COMPUTED_C = "biz_computed_prompts_coordinates_month"

# If True, attempt to populate raw_broader_category from TABLE_D (biz_raw_prompts_intent_category)
USE_BROADER_CATEGORY = True

# ========== SCRIPT ==========
print("Connecting to Postgres...")
conn = psycopg2.connect(**DB_CONN)
conn.autocommit = False
cur = conn.cursor()

# Normalized column names used in SELECT (adjust if your actual column names differ)
# This script uses:
#  - raw_facility_name in both tables
#  - raw_datetime_opened, raw_intent, raw_intent_count in biz_raw_prompts
#  - raw_latitude, raw_longitude, raw_county, raw_subcounty, com_ward, raw_facility_code in TABLE_A

try:
    print("Dropping existing target table if it exists...")
    cur.execute(sql.SQL("DROP TABLE IF EXISTS {}").format(sql.Identifier(COMPUTED_C)))
    conn.commit()

    print("Attempting to enable PostGIS extension (if available)...")
    try:
        cur.execute("CREATE EXTENSION IF NOT EXISTS postgis;")
        conn.commit()
        postgis_available = True
        print("PostGIS extension enabled (or already present).")
    except Exception as e:
        # If extension control file is missing, this will raise — we'll fallback below
        conn.rollback()
        postgis_available = False
        print("Could not enable PostGIS (it may not be installed on the server). Falling back.", file=sys.stderr)
        print(f"PostGIS enable error: {e}", file=sys.stderr)

    # Build the SELECT part (with optional join to intent-category)
    broader_category_select = "d.broader_category AS raw_broader_category" if USE_BROADER_CATEGORY else "NULL::text AS raw_broader_category"

    # If postgis available we compute com_geom using ST_SetSRID(ST_MakePoint(...), 4326)
    if postgis_available:
        com_geom_expr = (
            "ST_SetSRID(ST_MakePoint(b.raw_longitude::double precision, b.raw_latitude::double precision), 4326) "
            "AS com_geom"
        )
    else:
        # Avoid referencing the geometry type at all; create a plain NULL column so CREATE works on systems without PostGIS
        com_geom_expr = "NULL AS com_geom"

    # Compose the CREATE TABLE AS SELECT statement
    # Uses safe identifier composition via psycopg2.sql
    create_sql = sql.SQL(
        """
        CREATE TABLE {computed_table} AS
        SELECT
            b.raw_facility_code                         AS com_facility_code,
            a.raw_facility_name                         AS raw_facility_name,
            a.raw_datetime_opened,
            EXTRACT(YEAR FROM a.raw_datetime_opened)::INTEGER  AS com_year,
            EXTRACT(MONTH FROM a.raw_datetime_opened)::INTEGER AS com_month,
            a.raw_intent,
            {broader_category_select},
            a.raw_intent_count,
            b.raw_county                                AS com_county,
            b.raw_subcounty                             AS com_subcounty,
            b.raw_latitude                              AS com_latitude,
            b.raw_longitude                             AS com_longitude,
            b.com_ward,
            {com_geom_expr}
        FROM {table_c} a
        LEFT JOIN {table_a} b
            ON TRIM(LOWER(a.raw_facility_name)) = TRIM(LOWER(b.raw_facility_name))
        {optional_intent_join}
        ;
        """
    ).format(
        computed_table=sql.Identifier(COMPUTED_C),
        broader_category_select=sql.SQL(broader_category_select),
        com_geom_expr=sql.SQL(com_geom_expr),
        table_c=sql.Identifier(TABLE_C),
        table_a=sql.Identifier(TABLE_A),
        optional_intent_join=sql.SQL(
            "LEFT JOIN {table_d} d ON a.raw_intent = d.intent".format(table_d=sql.Identifier(TABLE_D).string)
        ) if USE_BROADER_CATEGORY else sql.SQL("")
    )

    # Note: Because psycopg2's sql module will quote identifiers, we inserted the optional_intent_join by formatting a string.
    # Execute the CREATE TABLE AS SELECT
    print("Creating computed table...")
    cur.execute(create_sql.as_string(conn))
    conn.commit()
    print(f":white_check_mark: Table '{COMPUTED_C}' created successfully.")

    # If PostGIS is available but you prefer an explicit geometry column type, you may want to ALTER the column to be typed geometry(Point,4326).
    # We can attempt that if postgis_available is True and the com_geom expression is not NULL.
    if postgis_available:
        try:
            print("Attempting to cast com_geom to geometry(Point,4326)...")
            cur.execute(sql.SQL(
                "ALTER TABLE {computed_table} ALTER COLUMN com_geom TYPE geometry(Point,4326) USING com_geom::geometry;"
            ).format(computed_table=sql.Identifier(COMPUTED_C)))
            conn.commit()
            print(":white_check_mark: com_geom column cast to geometry(Point,4326).")
        except Exception as e:
            conn.rollback()
            print("Warning: could not cast com_geom to geometry(Point,4326). It may already be a proper geometry or PostGIS reported an issue.", file=sys.stderr)
            print(f"Casting error: {e}", file=sys.stderr)

    print("All done.")
finally:
    try:
        cur.close()
        conn.close()
    except Exception:
        pass
