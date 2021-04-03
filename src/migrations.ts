import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { getMigrationTableName } from './templates';
import { messages } from './messages';
import { MigrationVersion } from './types';

export const getMigrationsToApply = (
	files: string[],
	rows: MigrationVersion[]
) => {
	const migrationsToApply = files.filter((version) => {
		return rows.every((r) => r.version !== version);
	});
	return migrationsToApply;
};

export const getMigrationFiles = (migrationDir: string) => {
	const files = fs.readdirSync(migrationDir, 'utf-8');
	for (const file of files) {
		const [ts] = file.split('-');
		if (path.extname(file) !== '.sql') {
			throw new Error(
				`Migration file is not a .sql file or does not have a .sql extension: ${file}`
			);
		}
		if (!/^\d+\.?\d+$/.test(ts)) {
			throw new Error(
				`Migration file does not use a valid pattern including timestamp: ${file}`
			);
		}
	}
	//Always sort according to timestamps
	return files.sort((a, b) => {
		const [tsa] = a.split('-');
		const [tsb] = b.split('-');
		return parseInt(tsa, 10) - parseInt(tsb, 10);
	});
};

export const getMigrationQueries = (version: string, migrationDir: string) => {
	const sql = fs.readFileSync(path.join(migrationDir, version), 'utf-8');
	const hasMigrationEntries =
		/-- migrate:up/g.test(sql) && /-- migrate:down/g.test(sql);

	if (!hasMigrationEntries) {
		throw new Error(
			`[MIGRATION] ${version} is missing -- migrate:up or -- migrate:down blocks`
		);
	}
	const [, upSQL, downSQL] = sql.split(/-- migrate:up|-- migrate:down/g);
	return { upSQL, downSQL };
};

export const applyMigrations = async (
	client: pg.Client,
	migrationsToApply: string[],
	migrationDir: string
) => {
	//Run everything in a transaction so we can rollback
	await client.query('BEGIN');
	try {
		for (const migration of migrationsToApply) {
			const { upSQL } = getMigrationQueries(migration, migrationDir);
			await client.query(upSQL);
			await client.query(
				/* Important to use statement_timestamp() and not current_timestamp, 
				otherwise the entire transaction share the same timestamp */
				`INSERT INTO ${getMigrationTableName()}(version, migration_time) VALUES($1, statement_timestamp())`,
				[migration]
			);
		}

		await client.query('COMMIT');
		messages.applying(client.host, migrationsToApply);
		return migrationsToApply;
	} catch (e) {
		messages.rollback(client.host, e.message);
		await client.query('ROLLBACK');
	}
	return [];
};

export const revertMigrations = async (
	client: pg.Client,
	migrationsToRevert: string[],
	migrationDir: string
) => {
	await client.query('BEGIN');
	try {
		for (const migration of migrationsToRevert) {
			const { downSQL } = getMigrationQueries(migration, migrationDir);
			await client.query(downSQL);
			await client.query(
				`DELETE FROM ${getMigrationTableName()} WHERE version = $1`,
				[migration]
			);
		}
		await client.query('COMMIT');
		messages.reverting(client.host, migrationsToRevert);
		return migrationsToRevert;
	} catch (e) {
		messages.rollback(client.host, e.message);
		await client.query('ROLLBACK');
	}
	return [];
};
