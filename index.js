import { Command } from 'commander';
import fetchPO from './src/fetchPO.js';
import updatePOT from './src/updatePOT.js';

const program = new Command();
program
    .description('Unofficial bridge between Bluesky and Transifex')
;
program.command('update-pot')
    .description('Update the .pot file in this repository starting from the one generated from the Bluesky repository.')
    .argument('<branch>', 'the name of the Bluesky branch')
    .argument('<potFile>', 'the path to the Bluesky .pot file')
    .argument('<outputDir>', 'the path to the output directory')
    .action(updatePOT)
;
program.command('fetch-po')
    .description('Fetch the .po files from Transifex and update this repository.')
    .argument('<token>', 'the Transifex API token')
    .argument('<output>', 'where to store the downloaded .po files')
    .action(fetchPO)
;

await program.parseAsync();
process.exit(0);
