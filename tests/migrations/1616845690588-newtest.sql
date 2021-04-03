-- migrate:up
   
create table test_table (
   id varchar(22)
)

-- migrate:down

drop table test_table
