#!/usr/bin/env node
import { resolve } from 'path';
import minimist from 'minimist';
import chalk from 'chalk';
import ora from 'ora';
import { Groundwork } from '.';

const {
  _: [src, dest = '.'],
  force = false,
} = minimist(process.argv.slice(2), {
  boolean: ['f', 'force'],
  alias: { f: 'force' },
});

(async () => {
  const groundwork = new Groundwork(src, resolve(dest), force);

  const spinner = ora(`Fetching ${chalk.cyan(src)}...`).start();

  await groundwork.parse();
  await groundwork.fetch();

  spinner.succeed();

  spinner.start(`Laying ground work...`);

  await groundwork.extract();

  spinner.succeed();
})().catch((err) => {
  process.stderr.write(err.stack);
  process.exit(1);
});
