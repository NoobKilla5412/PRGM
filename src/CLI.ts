#! /usr/bin/env node

import { readFileSync, writeFileSync } from "fs";
import { argv } from "yargs";
import { evalNewEnv } from "./DefaultEnv";
// import { compile } from "./eval/compile";
import { parse } from "./parse";

async function main() {
  if (argv instanceof Promise) {
    await argv;
  }
  if (argv instanceof Promise) return;

  let fileName = argv._[0].toString();
  const dir = argv.$0.split(/[/\\]/).slice(0, -1).join("/");
  const code = readFileSync(fileName).toString();
  let parsed = parse(code);
  let res = "";
  if (argv.c || argv.compile) {
    // res = await compile(parsed, dir);
  } else {
    await evalNewEnv(parsed, dir);
  }
  if (res) {
    if (argv.o || argv.output) {
      writeFileSync((argv.o || argv.output) as string, res);
    } else console.log(res);
  }
  return null;
}

main();
