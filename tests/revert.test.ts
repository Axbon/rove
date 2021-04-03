import { revert } from '../src/apis';
import { getBrokenMockClient, getMockClient } from './mockClient';

test('revert 1 test migration', async () => {
	const client = getMockClient([
		//Sorted in descending order as query does
		{ version: '1616847385068-secondtest.sql' },
		{ version: '1616845690588-newtest.sql' },
	]);
	const reverted = await revert({
		migrationDir: 'tests/migrations',
		client,
	});
	expect(client.query).toBeCalledTimes(6);
	expect(client.end).toBeCalledTimes(1);
	expect(reverted).toMatchObject(['1616847385068-secondtest.sql']);
	expect(client.query).toBeCalledWith('COMMIT');
});

test('revert all possible migrations', async () => {
	const client = getMockClient([
		//Sorted in descending order as query does
		{ version: '1616847385068-secondtest.sql' },
		{ version: '1616845690588-newtest.sql' },
	]);
	const reverted = await revert({
		migrationDir: 'tests/migrations',
		client,
		to: '1616845690588-newtest.sql',
	});
	expect(client.query).toBeCalledTimes(8);
	expect(client.end).toBeCalledTimes(1);
	expect(reverted).toMatchObject([
		'1616847385068-secondtest.sql',
		'1616845690588-newtest.sql',
	]);
	expect(client.query).toBeCalledWith('COMMIT');
});

test('revert query fails - uses rollback', async () => {
	const client = getBrokenMockClient({
		rows: [
			{ version: '1616847385068-secondtest.sql' },
			{ version: '1616845690588-newtest.sql' },
		],
		failQuery: 'DELETE FROM migrations WHERE version = $1',
	});
	const migrations = await revert({
		migrationDir: 'tests/migrations',
		client,
	});
	expect(migrations).toMatchObject([]);
	expect(client.query).toBeCalledTimes(6);
	expect(client.query).toBeCalledWith('ROLLBACK');
	expect(client.query).not.toHaveBeenCalledWith('COMMIT');
	expect(client.end).toBeCalledTimes(1);
});
