# Serverless Component Updater

[![npm](https://img.shields.io/npm/v/@slsplus/serverless-updater)](http://www.npmtrends.com/@slsplus/serverless-updater)
[![NPM downloads](http://img.shields.io/npm/dm/@slsplus/serverless-updater.svg?style=flat-square)](http://www.npmtrends.com/@slsplus/serverless-updater)
[![Build Status](https://github.com/serverless-plus/serverless-updater/workflows/Publish/badge.svg?branch=master)](https://github.com/serverless-plus/serverless-updater/actions?query=workflow:Publish+branch:master)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

Serverless Components Dependencies Updater

## Installation

```bash
$ npm install @slsplus/serverless-updater --g
```

## Usage

This will auto update dependencies in serverless component `src` directory, then commit to github and publish to registry.

```bash
$ slsup --auto-push --auto-publish
```

## Options

```
Options:
  -v, --version                     output the current version
  -c, --component <component name>  component name, multi component use `,` to connect
  -p, --path <path>                 path to component or parent directory for multi updating
  -s, --source <source>             source code directory name (default: "src")
  -m, --multi                       whether update multi components (default: false)
  -aps, --auto-push                 whether auto push to github (default: false)
  -apb, --auto-publish              whether auto publish component (default: false)
  -fpb, --force-publish             whether force to publish component (default: false)
  -h, --help                        display help for command
```

## Development

All `git commit` mesage must follow below syntax:

```bash
type(scope?): subject  #scope is optional
```

support type：

- **feat**: add new feature
- **fix**: fix bug or patch feature
- **ci**: CI
- **chore**: modify config, nothing to do with production code
- **docs**: create or modifiy documents
- **refactor**: refactor project
- **revert**: revert
- **test**: test

Most of time, we just use `feat` and `fix`.

## License

Copyright (c) 2019-present Tencent Cloud, Inc.
