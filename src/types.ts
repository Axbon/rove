import { Client } from 'pg';

export type MigrationVersion = {
  version: string;
};

export type CmdProps = {
  client: Client;
  migrationDir: string;
  to?: string;
};

export type CreateProps = {
  migrationName: string;
  migrationDir: string;
};

export type CmdFN<T = CmdProps, R = void> = (props: T) => Promise<R>;
