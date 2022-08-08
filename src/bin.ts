#!/usr/bin/env node
import chalk from 'chalk';
import Config from 'conf';
import inquirer from 'inquirer';
import minimist, { ParsedArgs } from 'minimist';
import ora from 'ora';
import { resolve } from 'path';
import { Groundwork } from './';

const config = new Config();

const login = async () => {
  const { token } = await inquirer.prompt([{ type: 'password', name: 'token', message: 'GitHub Token:' }]);

  return config.set('auth', { token });
};

const scaffold = async ([src, dest]: string[], force = false) => {
  const groundwork = new Groundwork(src, resolve(dest), { force, auth: config.get('auth.token', null) });

  const spinner = ora(`Fetching ${chalk.cyan(src)}...`).start();

  try {
    await groundwork.fetch();
    spinner.succeed();

    spinner.start(`Laying ground work...`);

    await groundwork.extract();

    spinner.succeed();
  } catch (err) {
    spinner.fail(`Please run ${chalk.cyan('groundwork login')} to authenticate.`);
  }
};

const program = async ({ _: [command, ...args], ...options }: ParsedArgs) => {
  switch (command) {
    case 'login':
      return login();

    default:
      return scaffold([command, ...args], options.force);
  }
};

program(
  minimist(process.argv.slice(2), {
    boolean: ['f', 'force'],
    alias: { f: 'force' },
  })
).catch((err) => {
  process.stderr.write(err.stack);
  process.exit(1);
});
