import path from 'node:path';
import POFile from './POFile.js';
import fs from 'node:fs';

function updatePOT(branch, potFile, outputDir)
{
    const newPOT = POFile.fromFile(potFile, true);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }
    const potFileOLD = path.join(outputDir, `${branch}.pot`);
    let updatePOT;
    if (fs.existsSync(potFileOLD)) {
        const oldPOT = POFile.fromFile(potFileOLD, true);
        if (oldPOT.sameStrings(newPOT)) {
            process.stdout.write(`No changes detected for the .pot file of branch ${branch}\n`);
            updatePOT = false;
        } else {
            process.stdout.write(`Changes detected for the .pot file of branch ${branch}\n`);
            updatePOT = true;
        }
    } else {
        process.stdout.write(`New .pot file for branch ${branch}`);
        updatePOT = true;
    }
    if (updatePOT) {
        fs.copyFileSync(potFile, potFileOLD);
    }
    if (process.env.GITHUB_OUTPUT) {
        fs.appendFileSync(process.env.GITHUB_OUTPUT, `updated=${updatePOT ? 'yes' : 'no'}\n`);
    } else {
        process.stdout.write('GITHUB_OUTPUT environment variable not defined');
    }
}

export default updatePOT;
