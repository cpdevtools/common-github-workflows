import { createVersionBranch } from './lib/create-version-branch';
import yargs from 'yargs';
import { hideBin } from "yargs/helpers";

(async () => {
    const arg = await yargs(hideBin(process.argv))
        .version(false)
        .option('version', {
            describe: 'Version to apply',
            type: 'string',
            demandOption: true,
            default: 'main'
        }).parse();

    await createVersionBranch(arg.version);
})();
