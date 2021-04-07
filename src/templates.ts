import dotenv from 'dotenv';

export const getMigrationTableName = () => {
  const { parsed: envVars } = dotenv.config();
  return envVars?.ROVE_MIGRATIONS_TABLE ?? 'migrations';
};

export const sqlCreateMigrationsTable = `
  CREATE TABLE IF NOT EXISTS ${getMigrationTableName()} (
    version VARCHAR(255) NOT NULL UNIQUE,
    migration_time TIMESTAMP NOT NULL
  );
`;

export const sqlGetMigrations = `SELECT version FROM ${getMigrationTableName()} ORDER BY migration_time DESC`;
export const sqlGetLastMigration = `SELECT version, migration_time FROM ${getMigrationTableName()} ORDER BY migration_time DESC LIMIT 1`;

export const migrationTemplate = `
-- migrate:up
   
   /* put your up/forward migration code here */

-- migrate:down

   /* put your down/revert migration code here */
`;
