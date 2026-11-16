import { runRenumber } from "./lib/renumber";

process.exitCode = runRenumber(process.argv.slice(2), process.cwd());
