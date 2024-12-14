import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import child_process from 'node:child_process';
import { tmpdir } from 'node:os';

const projectRootDir = path.resolve(fileURLToPath(import.meta.url), '../..').replaceAll(path.sep, '/').trimEnd(path.sep);

/**
 * @param {string} file
 *
 * @returns {string}
 */
/**
 * @param {string} file
 *
 * @returns {string}
 */
function extractLocale(file)
{
    const po = fs.readFileSync(file, {encoding: 'utf-8'}).toString();
    const match = /("|\\n)Language:\s*(?<locale>[\w\-]+)/.exec(po);
    if (!match) {
        throw new Error('Failed to extract the locale from the .po file');
    }
    return match.groups['locale'];
}

/**
 * @param {string} tempDir
 * @param {string} locale
 *
 * @returns {string}
 */
function createConfigFile(tempDir, locale)
{
    const config = `
module.exports = {
  format: 'po',
  locales: ['${locale}'],
  catalogs: [
    {
      path: ${JSON.stringify(tempDir.replaceAll(path.sep, '/').trimEnd('/') + '/{locale}')},
    },
  ],
}`;
    const configFile = path.join(tempDir, 'lingui.config.js');
    fs.writeFileSync(configFile, config, {encoding: 'utf-8'});

    return configFile;
}

/**
 * @param {string} configFile 
 */
async function runLingui(configFile)
{
    const child = child_process.spawn(
        process.execPath,
        [
            './node_modules/@lingui/cli/dist/lingui.js',
            'compile',
            '--config',
            configFile,
        ],
        {
            cwd: projectRootDir,
            stdio: [
                // stdin
                'ignore',
                // stout
                'ignore',
                // stderr
                'pipe',
            ],
        }
    );
    let someStdErr = false;
    child.stderr.on('data', (data) => {
        data = data.toString();
        if (someStdErr === false) {
            let clean = data;
            clean = clean.replace(/^Debugger attached\.*\s*/, '');
            clean = clean.replace(/^Waiting for the debugger to disconnect\.*\s*/, '');
            clean = clean.replace(/^Waiting for the debugger to disconnect\.*\s*/, '');
            if (clean !== '') {
                someStdErr = true;
            }
        }
        process.stderr.write(data);
    });

    return new Promise((resolve, reject) => {
        child.on('close', (code) => {
            if (code !== 0 || someStdErr) {
                reject(new Error('lingui compile failed'));
            } else {
                resolve();
            }
        });
    });
}
/**
 * @param {string} file
 * @param {bool} writeGood
 */
async function checkPO(file, writeGood = true)
{
    const locale = extractLocale(file);
    const tempDir = fs.mkdtempSync(path.join(tmpdir(), 'bsp-'));
    try {
        const tempFile = path.join(tempDir, `${locale}.po`);
        fs.copyFileSync(file, tempFile);
        const configFile = createConfigFile(tempDir, locale);
        await runLingui(configFile);
    } finally {
        fs.rmSync(tempDir, {force: true, recursive: true})
    }
    if (writeGood) {
        process.stdout.write(`The file ${file} is correct.\n`);
    }
}

export default checkPO;
