import fs from 'fs';
import path from 'path';
import { messages } from './messages';
import {
	applyMigrations,
	getMigrationFiles,
	getMigrationsToApply,
	revertMigrations,
} from './migrations';
import {
	migrationTemplate,
	sqlCreateMigrationsTable,
	sqlGetLastMigration,
	sqlGetMigrations,
} from './templates';
import { CmdFN, CreateProps, CmdProps } from './types';

export const create: CmdFN<CreateProps, string> = async ({
	migrationDir,
	migrationName,
}) => {
	if (!migrationName) {
		throw new Error(
			'Missing filename argument for create. Ex: rove create <name-of-migration>'
		);
	}
	if (/\s/g.test(migrationName)) {
		throw new Error(`Name of migration can't include spaces/whitespace.`);
	}
	if (migrationName.length >= 255) {
		throw new Error(`Name of migration is absurdly long. Try a shorter one :)`);
	}
	const ts = new Date().getTime();
	const file = `${ts}-${migrationName}.sql`;

	fs.writeFileSync(path.join(migrationDir, file), migrationTemplate, 'utf-8');
	messages.created(file);

	return file;
};

export const migrate: CmdFN<CmdProps, string[]> = async ({
	client,
	to,
	migrationDir,
}) => {
	await client.query(sqlCreateMigrationsTable);
	const { rows } = await client.query(sqlGetMigrations);
	const files = getMigrationFiles(migrationDir);
	const target = to ?? files[files.length - 1];
	const indexOfTarget = files.findIndex((f) => f === target);
	const doesNotExist = indexOfTarget === -1;

	if (doesNotExist) {
		throw new Error(`The following migration was not found: ${target}`);
	}

	const migrationsToApply = getMigrationsToApply(
		files.slice(0, indexOfTarget + 1),
		rows
	);
	const migrations = await applyMigrations(
		client,
		migrationsToApply,
		migrationDir
	);
	await client.end();
	return migrations;
};

export const revert: CmdFN<CmdProps, string[]> = async ({
	client,
	to,
	migrationDir,
}) => {
	await client.query(sqlCreateMigrationsTable);
	const { rows } = await client.query(sqlGetLastMigration);
	const [row] = rows;

	if (!row) {
		messages.noneToRevert(client.host);
		await client.end();
		return [];
	}

	const files = getMigrationFiles(migrationDir);
	const rev = to ?? row.version;
	const indexOfLast = files.findIndex((f) => f === row.version);
	const indexOfTarget = files.findIndex((f) => f === rev);
	const doesNotExist = indexOfTarget === -1;

	if (doesNotExist) {
		throw new Error(
			`Trying to revert to a migration that does not exist: ${rev}`
		);
	}

	//Migrations are run in reverse order
	const migrationsToRevert = files
		.slice(indexOfTarget, indexOfLast + 1)
		.reverse();

	const reverted = await revertMigrations(
		client,
		migrationsToRevert,
		migrationDir
	);
	await client.end();
	return reverted;
};
