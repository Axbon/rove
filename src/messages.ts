import chalk from 'chalk';
import dotenv from 'dotenv';

const withLogging = (fnMessage: Function) => {
  const { parsed: envVars } = dotenv.config();
  const shouldLog = envVars?.ROVE_LOGGING === '0' ? false : true;
  if (shouldLog) {
    return fnMessage;
  }
  return () => null;
};

export const messages = {
  availableCommands: withLogging(() =>
    console.log(
      [
        '* Welcome to rove!',
        '* Usage: rove <command> <param> <migration>',
        '',
        '* Commands:',
        '* create <name> : create new migration with <name>',
        '* migrate : run all migrations until latest',
        '* migrate to <migration-filename> : run all migrations until and including <migration>',
        '* revert : revert latest migration',
        '* revert to <migration-filename> : revert until and including <migration>\n',
        chalk.hex('#629CBE')(
          [
            '* Examples: ',
            '* rove create add-customers-table',
            '* rove migrate',
            '* rove revert to 1617380793905-add-customers-table.sql \n',
          ].join('\n')
        ),
      ].join('\n')
    )
  ),
  created: withLogging((msg: string) =>
    console.log(
      `\n${chalk.hex('#339855')(`[MIGRATION]: Created  ${msg}\n - `)}`
    )
  ),
  applying: withLogging((host: string, msgs: string[]) => {
    if (msgs.length === 0) {
      return console.log(
        `\n${chalk.hex('#339855')(`[NOOP ${host}]: No migrations to run\n`)}`
      );
    }
    return console.log(
      `\n${chalk.hex('#339855')(
        `[MIGRATED ${host}]: \n - ${msgs.join('\n - ')}\n`
      )}`
    );
  }),
  reverting: withLogging((host: string, msgs: string[]) => {
    if (msgs.length === 0) {
      return console.log(
        `\n${chalk.hex('#964392')(
          `[NOOP ${host}]: No migrations to revert \n`
        )}`
      );
    }
    return console.log(
      `\n${chalk.hex('#964392')(
        `[REVERTED ${host}]: \n - ${msgs.join('\n - ')}\n`
      )}`
    );
  }),
  noneToRevert: withLogging((host: string) =>
    console.log(
      '\n%s\n',
      chalk.hex('#964392')(`[MIGRATIONS ${host}] No migrations to revert.`)
    )
  ),
  rollback: withLogging((host: string, msg: string) =>
    console.log(
      `\n* %s`,
      chalk.redBright(
        `[ERROR ${host}] - An error occured during migrations. No migrations were made. Error message: \n* ${msg}\n`
      )
    )
  ),
  error: withLogging((msg: string) =>
    console.log(`\n* %s`, chalk.redBright(`[ERROR] ${msg}\n`))
  ),
};
