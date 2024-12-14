import { transifexApi as TX } from '@transifex/api';
import path from 'node:path';
import fs from 'node:fs';
import POFile from './POFile.js';
import checkPO from './checkPO.js';

const TX_ORGANIZATION_SLUG = 'mlocati';
const TX_PROJECT_SLUG = 'bluesky-unofficial'

/**
 * @param {string} txToken 
 * @param {string} outputDirectory
 * @param {string} ghOutput
 */
async function fetchPO(txToken, outputDirectory, ghOutput = '')
{
    if (!fs.existsSync(outputDirectory)) {
        fs.mkdirSync(outputDirectory);
    }
    TX.setup({
        auth: txToken,
    });
    process.stdout.write('Fetching organization... ');
    const txOrganization = await TX.Organization.get({slug: TX_ORGANIZATION_SLUG});
    process.stdout.write(`${txOrganization.get('name')}\n`);
    process.stdout.write('Fetching project... ');
    const txProjectsService = await txOrganization.fetch('projects');
    const txProject = await txProjectsService.get({slug: TX_PROJECT_SLUG});
    process.stdout.write(`${txProject.get('name')}\n`);
    process.stdout.write('Listing resources:\n');
    const txResourcesService = await txProject.fetch('resources');
    const txResources = [];
    for await (const txResource of txResourcesService.all()) {
        txResources.push(txResource);
        process.stdout.write(`- ${txResource.get('slug')}\n`);
    }
    if (txResources.length === 0) {
        throw new Error('No resource found!')
    }
    process.stdout.write('Listing languages:\n');
    const txLanguagesService = await txProject.fetch('languages');
    const txLanguages = [];
    for await (const txLanguage of txLanguagesService.all()) {
        txLanguages.push(txLanguage);
        process.stdout.write(`- ${txLanguage.get('code')}\n`);
    }
    if (txLanguages.length === 0) {
        throw new Error('No language found!')
    }
    let updated = false;
    for (const txResource of txResources) {
        process.stdout.write(`Processing resource ${txResource.get('slug')}\n`);
        const resourceDir = path.resolve(outputDirectory, txResource.get('slug'));
        if (!fs.existsSync(resourceDir)) {
            fs.mkdirSync(resourceDir);
        }
        for (const txLanguage of txLanguages) {
            process.stdout.write(`- ${txLanguage.get('code')}... `);
            const url = await TX.ResourceTranslationsAsyncDownload.download({
                resource: txResource,
                language: txLanguage,
            });
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(await response.text());
            }
            const originalPO = await response.text();
            const poFile = POFile.fromString(originalPO);
            poFile.normalize();
            const poFilePath = path.resolve(resourceDir, txLanguage.get('code') + '.po');
            let poIsNew = true;
            if (fs.existsSync(poFilePath)) {
                const oldPO = POFile.fromFile(poFilePath);
                if (poFile.sameStrings(oldPO)) {
                    poIsNew = false;
                }
            }
            if (poIsNew) {
                fs.writeFileSync(poFilePath, poFile.toString(), {encoding: 'utf8'});
                checkPO(poFilePath, false);
                process.stdout.write('updated.\n');
                updated = true;
            } else {
                process.stdout.write('no changes.\n');                
            }
        }
    }
    if (process.env.GITHUB_OUTPUT) {
        fs.appendFileSync(process.env.GITHUB_OUTPUT, `updated=${updated ? 'yes' : 'no'}\n`);
    } else {
        process.stdout.write('GITHUB_OUTPUT environment variable not defined');
    }
}

export default fetchPO;
