#!/usr/bin/env node
const fse = require('fs-extra');
const { hashElement } = require('folder-hash');
const execa = require('execa');
const path = require('path');

/**
 * Ensures that errors throw an error with a stacktrace.
 */
process.on('unhandledRejection', error => {
    throw error;
});

const getHash = async dir => {
    const { hash } = await hashElement(dir, {
        folders: {
            exclude: ['.cache', 'dist'],
        },
    });

    return hash;
};

/**
 * Runs a passed in command if the folder contents have changed. This ensures that we are only
 * rebuilding `dist` folders when needed.
 */
(async () => {
    const cwd = process.cwd();
    const hashFilePath = path.join(cwd, '.cache/contents-hash');
    const hashExists = await fse.pathExists(hashFilePath);

    const existingHash = hashExists && (await fse.readFile(hashFilePath, 'utf8'));

    const newHash = await getHash(`${cwd}/`);

    if (existingHash !== newHash) {
        // Grab only parts of `argv` that are needed.
        const command = process.argv.slice(3);

        const { stdout, stderr } = await execa.shell(`${command.join(' ')}`, {
            // Maintain output colors
            stdio: 'inherit',
        });

        if (stdout) {
            // eslint-disable-next-line no-console
            console.log(stdout);
        }

        if (stderr) {
            // eslint-disable-next-line no-console
            console.error(stderr);
        }

        await fse.outputFile(hashFilePath, newHash);
    }
})();
