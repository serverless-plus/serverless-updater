#!/usr/bin/env node

const { program } = require('commander');
const pkg = require('../package.json');

const Updater = require('../src/updater');

async function main() {
  program
    .version(pkg.version, '-v, --version', 'output the current version')
    .option(
      '-c, --component <component name>',
      'component name, multi component use `,` to connect',
    )
    .option(
      '-p, --path <path>',
      'path to component or parent directory for multi updating',
      process.cwd(),
    )
    .option('-s, --source <source>', 'source code directory name', 'src')
    .option('-m, --multi', 'whether update multi components', false)
    .option('-aps, --auto-push', 'whether auto push to github', false)
    .option('-apb, --auto-publish', 'whether auto publish component', false)
    .option('-fpb, --force-publish', 'whether force to publish component', false);

  program.on('--help', () => {
    console.log('');
    console.log('Example call:');
    console.log('  $ slsup --help');
  });

  program.parse(process.argv);

  const { component, path, source, multi, autoPush, autoPublish, forcePublish } = program;
  let list = ['component'];
  if (multi) {
    list = component.split(',');
  }
  const up = new Updater({
    list: list,
    compPath: path,
    sourceDir: source,
    multi: multi,
    autoPush: autoPush,
    autoPublish: autoPublish,
    forcePublish: forcePublish,
  });

  await up.run();
}

main();

process.on('unhandledRejection', (e) => {
  throw e;
});
