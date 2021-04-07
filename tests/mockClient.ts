import pg from 'pg';
import { MigrationVersion } from '../src/types';

export const getMockClient = (rows: MigrationVersion[] = []) => {
  return ({
    query: jest.fn(() => Promise.resolve({ rows })),
    end: jest.fn(),
  } as unknown) as pg.Client;
};

export const getBrokenMockClient = ({
  rows,
  failQuery,
}: {
  rows: MigrationVersion[];
  failQuery: string;
}) => {
  return ({
    query: jest.fn((query) => {
      if (query === failQuery) {
        throw new Error('A migration query failed!');
      }
      return { rows };
    }),
    end: jest.fn(),
  } as unknown) as pg.Client;
};
