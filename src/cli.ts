#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';
import { messages } from './messages';
import { sqlCreateMigrationsTable } from './templates';
import { create, migrate, revert } from './apis';
import { CmdFN, CreateProps, CmdProps } from './types';

const commands: Record<
	string,
	CmdFN<CmdProps, string[]> | CmdFN<CreateProps, string>
> = {
	create,
	migrate,
	revert,
};

const validateEnvVars = (envVars: Record<string, string>) => {
	const keys = Object.keys(envVars);
	const needed = ['DB_USER', 'DB_HOST', 'DB_NAME', 'DB_PASS'];
	const current = needed.filter((nv) => !keys.includes(nv));
	if (current.length > 0) {
		throw new Error(`Missing necessary env variables: ${current.join(', ')}`);
	}
};

const connectDb = async (envVars: Record<string, string>) => {
	validateEnvVars(envVars);
	const { DB_HOST, DB_NAME, DB_PASS, DB_USER, DB_PORT } = envVars;
	const client = new pg.Client({
		user: DB_USER,
		host: DB_HOST,
		database: DB_NAME,
		password: DB_PASS,
		port: DB_PORT ? parseInt(DB_PORT) : 5432,
	});
	await client.connect();
	return client;
};

const run = async ([command, migrationName, to]: string[]) => {
	const cmdFn = commands?.[command];
	const { parsed: envVars } = dotenv.config();

	if (!envVars) {
		return messages.error('Could not load ".env" from root dir');
	}

	const { ROVE_MIGRATIONS_DIR } = envVars;
	const migrationDir = path.join(
		process.cwd(),
		ROVE_MIGRATIONS_DIR ?? 'migrations'
	);

	if (!fs.existsSync(migrationDir)) {
		return messages.error(`No migration path found ${migrationDir}`);
	}

	if (!cmdFn) {
		messages.error(`Unrecognized command or no command supplied: ${command}`);
		return messages.availableCommands();
	}

	let client;

	try {
		client = await connectDb(envVars);
		const args = { command, client, migrationName, to, migrationDir };
		await cmdFn(args);
		await client.end();
	} catch (e) {
		if (client) {
			client.end();
		}
		messages.error(`${e.message}`);
	}
};

run(process.argv.slice(2));
