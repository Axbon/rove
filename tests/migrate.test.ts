import pg from 'pg';
import { migrate } from '../src/apis';
import { MigrationVersion } from '../src/types';
import { getBrokenMockClient, getMockClient } from './mockClient';

test('migrate 1 test migration', async () => {
	const client = getMockClient();
	const migrations = await migrate({
		migrationDir: 'tests/migrations',
		client,
		to: '1616845690588-newtest.sql',
	});
	expect(client.query).toBeCalledTimes(6);
	expect(client.end).toBeCalledTimes(1);
	expect(client.query).toBeCalledWith('COMMIT');
	expect(migrations).toMatchObject(['1616845690588-newtest.sql']);
});

test('migrate all from current state', async () => {
	const client = getMockClient([{ version: '1616845690588-newtest.sql' }]);
	const migrations = await migrate({
		migrationDir: 'tests/migrations',
		client,
	});
	expect(migrations).toMatchObject(['1616847385068-secondtest.sql']);
	expect(client.query).toBeCalledTimes(6);
	expect(client.end).toBeCalledTimes(1);
	expect(client.query).toBeCalledWith('COMMIT');
});

test('migrate all test migrations', async () => {
	const client = getMockClient();
	const migrations = await migrate({
		migrationDir: 'tests/migrations',
		client,
	});
	expect(client.query).toBeCalledTimes(8);
	expect(client.end).toBeCalledTimes(1);
	expect(migrations).toMatchObject([
		'1616845690588-newtest.sql',
		'1616847385068-secondtest.sql',
	]);
	expect(client.query).toBeCalledWith('COMMIT');
});

test('migration query fails - uses rollback', async () => {
	const client = getBrokenMockClient({
		rows: [],
		failQuery:
			'INSERT INTO migrations(version, migration_time) VALUES($1, statement_timestamp())',
	});
	const migrations = await migrate({
		migrationDir: 'tests/migrations',
		client,
	});
	expect(migrations).toMatchObject([]);
	expect(client.query).toBeCalledTimes(6);
	expect(client.query).not.toHaveBeenCalledWith('COMMIT');
	expect(client.query).toBeCalledWith('ROLLBACK');
	expect(client.end).toBeCalledTimes(1);
});
