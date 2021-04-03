-- migrate:up
   
ALTER TABLE test_table RENAME COLUMN id TO city_id;

-- migrate:down

ALTER TABLE test_table RENAME COLUMN city_id TO id;
