/*
  # Add get_distinct_cities function

  1. New Functions
    - `get_distinct_cities`: Returns an array of distinct city names from the places table
*/

CREATE OR REPLACE FUNCTION get_distinct_cities()
RETURNS text[] AS $$
BEGIN
  RETURN ARRAY(
    SELECT DISTINCT city 
    FROM places 
    WHERE city IS NOT NULL 
    ORDER BY city
  );
END;
$$ LANGUAGE plpgsql;