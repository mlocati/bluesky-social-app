import { Command } from 'commander';
import fetchPO from './src/fetchPO.js';
import updatePOT from './src/updatePOT.js';
import checkPO from './src/checkPO.js';

const program = new Command();
program
    .description('Unofficial bridge between Bluesky and Transifex')
;
program.command('update-pot')
    .description('Update the .pot file in this repository starting from the one generated from the Bluesky repository.')
    .argument('<branch>', 'the name of the Bluesky branch')
    .argument('<potFile>', 'the path to the Bluesky .pot file')
    .argument('<outputDir>', 'the path to the output directory')
    .argument('<ghOutput>', 'the value of the GITHUB_OUTPUT environment variable (may be empty)')
    .action(updatePOT)
;
program.command('fetch-po')
    .description('Fetch the .po files from Transifex and update this repository.')
    .argument('<token>', 'the Transifex API token')
    .argument('<output>', 'where to store the downloaded .po files')
    .argument('<ghOutput>', 'the value of the GITHUB_OUTPUT environment variable (may be empty)')
    .action(fetchPO)
;
program.command('check-po')
    .description('Check if a .po file is valid.')
    .argument('<file>', 'the path of the .po file to be checked')
    .action(checkPO)
;

await program.parseAsync();
process.exit(0);
