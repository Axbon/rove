# Rove

The tiny, simple migration tool for Postgres when using node.
Written in typescript and comes with types included.

Rove supports programatically applying migrations to multiple
database servers via api, while also permitting the use of handling
migrations via a simple cli.

Rove creates single .sql files in a directory of your choice - _"migrations"_ by
default. These are timestamped. Within each .sql file there is an --up and --down
block where you can write your up/down sql code.

Traditionally many libs creates 2 or 4 files for these purposes, one up/down .js file
and optionally additional up/down .sql files. I wanted something simpler where
each migration exists within a single .sql file.

Rove barely has any depedencies, only pg for postgres and dotenv + chalk for some cli
stuff. Enjoy!

### Cli

```
* create <name> : create new migration with <name>
* migrate : run all migrations until latest
* migrate to <migration-filename> : run all migrations until and including <migration-filename>
* revert : revert latest migration
* revert to <migration-filename> : revert until and including <migration-filename>
```

### Configuration - cli

By default when using the cli, rove looks for a _".env"_ file in your project root directory.
If this file does not exist, rove bails early. It is best practice to only have one _.env_ per
project. If you need a custom solution here please see the rove api.

The following variables must exist in your _.env_

```
DB_HOST=localhost
DB_USER=postgres
DB_PASS=thepass
DB_NAME=yourdb
DB_PORT=5432
```

There are some additional variables that are optional and have default values. These are:

```
ROVE_MIGRATIONS_DIR=migrations
ROVE_MIGRATIONS_TABLE=migrations
ROVE_LOGGING=1
```

Those are configured by default with the values above, because of that they are optional and not
needed in your _.env_ file unless you want to change these. The directory where rove looks for and creates
migration files is _"rootDirectory/migrations"_. The table that rove creates in your database is called
_"migrations"_ by default. If you wish to disable rove cli output/logging, set _ROVE_LOGGING=0_ in your _.env_

#### Cli Examples

Creating migrations:

```
rove create customer-table
```

Running (all) migrations

```
rove migrate
```

Running migrations up to and including 123-x-migration.sql

```
rove migrate to 123-x-migration.sql
```

Revert last migration (Only 1)

```
rove revert
```

Revert all migrations until and including 123-x-migration.sql

```
rove revert to 123-x-migration.sql
```

### Api

You can use the api for customized approach. In the case where you have multiple
database servers or similar.

You need to use the pg package to supply the database adapter to rove.
https://github.com/brianc/node-postgres

```js
import pg from 'pg';
import { revert, migrate, create } from 'rove';

//Note: never put db connection string in code, use env-variables for this.
const client = new pg.Client({
	user: 'mydbuser',
	host: 'localhost',
	database: 'rovedbtest',
	password: '',
	port: 5432,
});

const run = async () => {
	await client.connect();

	/* 
     Apply all migrations to the currently connected db (client)
     migrationDir is the name of the dir containing the .sql migration files
     to is optional
     
     Rove will automatically call client.end() when finished
     */
	const roveArgs = {
		client,
		migrationDir: 'dir-containing-migrations',
	};
	try {
		await migrate(roveArgs);
	} catch (e) {
		//Handle any errors. Note, if any exceptions are thrown, migrations are not commited.
		client.end();
	}
	//done
};
```

## Multiple servers

Handling multiple servers is simply a matter of connecting to many and iterating, using the same api.

```js
const dbClients = [...your db clients];

/* Given an array of connected db-adapters or similar */

for(const client of dbClients){
	await client.connect();


	const roveArgs = {
		client,
		migrationDir: 'dir-containing-migrations',
	};
	try {
		await migrate(roveArgs);
	} catch (e) {
		//Handle any errors. Note, if any exceptions are thrown, migrations are not commited.
		client.end();
	}
	//done
}
```

### Sql files

By default the migration files that rove creates looks like this:

```sql

-- migrate:up

   /* put your up/forward migration code here */

-- migrate:down

   /* put your down/revert migration code here */
```

Your actual sql code for the up/down part of the migrations goes between
the two blocks, like so:

```sql
-- migrate:up

create table science (
   id varchar(22)
)

-- migrate:down

drop table science
```
