const { execSync, spawnSync } = require('child_process');
const { resolve } = require('path');
const ncu = require('npm-check-updates');
const yaml = require('js-yaml');
const fs = require('fs');
const semver = require('semver');
const ora = require('ora');

class Updater {
  constructor({
    list,
    multi,
    depsFilter,
    compPath,
    sourceDir,
    autoPublish,
    autoPush,
    forcePublish,
    commitType,
  }) {
    // component list to update
    this.list = list;
    // whether to update multi components
    this.multi = multi;
    // component path or parent path
    this.compPath = resolve(process.cwd(), compPath);
    // source code dir for component, default is src
    this.sourceDir = sourceDir;
    // whether auto push code to github
    this.autoPush = autoPush;
    // whether auto publish component to registry
    this.autoPublish = autoPublish;
    // whether auto publish component to registry
    this.forcePublish = forcePublish;

    this.spinner = null;

    // current updating module
    this.currrentModule = null;
    // current work cwd
    this.cwd = null;

    // deps filter for ncu
    this.depsFilter = depsFilter;

    // commit type
    this.commitType = commitType;
  }

  info(msg) {
    this.spinner.info(`[${this.currrentModule}] ${msg}`);
  }
  succeed(msg) {
    this.spinner.succeed(`[${this.currrentModule}] ${msg}`);
  }
  fail(msg) {
    this.spinner.fail(`[${this.currrentModule}] ${msg}`);
  }

  // sync git status
  async syncGitStatus(cwd = process.cwd()) {
    this.info(`Syncing github code`);
    const gitOptions = { cwd: cwd };
    // 1. checkout master
    spawnSync('git', ['checkout master'], gitOptions);
    // 2. git pull
    spawnSync('git', ['pull', 'origin', 'master'], gitOptions);
  }

  // update component yaml and publish a new version
  async updateComponentYaml(ymlPath, ymlConfig) {
    const oldVersion = ymlConfig.version;
    ymlConfig.version = semver.inc(oldVersion, 'patch');
    this.info(`Updating serverless.component.yml version to ${ymlConfig.version}`);
    fs.writeFileSync(ymlPath, yaml.safeDump(ymlConfig), 'utf8');

    return `${ymlConfig.name}@${ymlConfig.version}`;
  }

  // publish component
  async publishComponent(cwd = process.cwd(), pubCompVersion) {
    this.info(`Publishing component ${pubCompVersion}`);
    try {
      execSync('serverless registry publish --debug', {
        cwd: cwd,
      });
      this.succeed(`Publish component ${pubCompVersion} successfully`);
    } catch (e) {
      const errorOutput = e.stdout.toString();
      this.fail(errorOutput);
      process.exit(1);
    }
  }

  // update project npm dependencies
  async updateDeps(cwd = process.cwd()) {
    const sourcePath = `${cwd}/${this.sourceDir}`;
    let needUpdate = false;
    this.info(`Upgrading dependencies in package.json`);
    // 1. update package.json
    const ncuOptions = {
      upgrade: true,
      jsonUpgraded: true,
      silent: true,
      cwd: sourcePath,
      filter: this.depsFilter,
      packageFile: `${sourcePath}/package.json`,
    };
    const upgraded = await ncu.run(ncuOptions);
    if (Object.keys(upgraded).length > 0) {
      needUpdate = true;
      const updateItems = Object.entries(upgraded).map(([name, version]) => `${name}@${version}`);
      const updateStr = updateItems.join(',');
      // 2. npm install latest deps
      this.info(`Updating dependencies: ${updateStr}`);
      this.info(`Installing latest dependencies...`);
      spawnSync('npm', ['install'], { cwd: sourcePath });
    } else {
      this.info(`No dependencies need to upgrade in package.json`);
    }

    return needUpdate;
  }

  async commitGit(cwd = process.cwd()) {
    this.info(`Commiting git changes`);
    spawnSync('git', ['add', `${cwd}/${this.sourceDir}/package.json`], {
      cwd: cwd,
    });
    spawnSync('git', ['add', `${cwd}/serverless.component.yml`], { cwd: cwd });
    spawnSync('git', ['commit', '-m', `${this.commitType}: update deps`], { cwd: cwd });
    if (this.autoPush) {
      this.info(`Pushing latest code to github`);
      spawnSync('git', ['push', 'origin', 'master'], { cwd: cwd });
    }
  }

  async updateOne(cwd = process.cwd()) {
    const compYamlPath = `${cwd}/serverless.component.yml`;
    const ymlConfig = yaml.safeLoad(fs.readFileSync(compYamlPath, 'utf8'));

    this.currrentModule = ymlConfig.name;

    this.info(`Updating`);
    // 1. sync git status
    await this.syncGitStatus(cwd);
    // 2. update npm deps
    const needUpdate = await this.updateDeps(cwd);
    let pubCompVersion;
    if (needUpdate) {
      // 3. update serverless.component.yml
      pubCompVersion = await this.updateComponentYaml(compYamlPath, ymlConfig);
      // 4. commit git change
      await this.commitGit(cwd);
    }
    // 5. publish component
    // when need update and set autoPublish to true, or set forcePublish to true
    if ((needUpdate && this.autoPublish) || this.forcePublish) {
      await this.publishComponent(cwd, pubCompVersion);
    }
    this.succeed(`Done`);
  }

  async run() {
    try {
      this.spinner = ora().start('Start updating serverless components...');

      const { list } = this;
      for (let i = 0, len = list.length; i < len; i++) {
        const compName = list[i];
        let compPath = resolve(`${this.compPath}`);
        if (this.multi) {
          compPath = resolve(`${this.compPath}/${compName}`);
        }
        this.cwd = compPath;

        await this.updateOne(compPath);
      }
    } catch (e) {
      throw e;
    }
  }
}

module.exports = Updater;
