#!/usr/bin/env node

import { readFileSync, writeFileSync } from "fs";
import { argv } from "yargs";
import { evalNewEnv } from "./DefaultEnv";
import { parse } from "./parse";

// const prompt = _prompt();

async function main() {
  if (argv instanceof Promise) {
    await argv;
  }
  if (argv instanceof Promise) return;

  // if (argv.i || argv.interactive) {
  //   const env = defaultEnv();
  //   let input = "";
  //   while ((input = prompt({ ask: "> " })) != ".exit") {
  //     console.log(await evaluate(parse(input), env, 0, ".", undefined, undefined, false));
  //   }
  //   return;
  // }

  let fileName = argv._[0].toString();
  const dir = argv.$0.split(/[/\\]/).slice(0, -1).join("/");
  const code = readFileSync(fileName).toString();
  let parsed = parse(code);
  let res = "";
  /* if (argv.c || argv.compile) {
    // res = await compile(parsed, dir);
  } else */ {
    await evalNewEnv(parsed, dir);
  }
  if (res) {
    if (argv.o || argv.output) {
      writeFileSync((argv.o || argv.output) as string, res);
    } else console.log(res);
  }
}

main();
