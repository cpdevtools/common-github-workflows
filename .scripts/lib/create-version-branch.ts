import simpleGit from 'simple-git';
import { applyVersion } from './apply-version';


export async function createVersionBranch(version: string = 'main') {
    console.log('createVersionBranch', version);

    if (version !== 'main') {
        const git = simpleGit();
        const currentBranch = await git.branch();
        const currentBranchName = currentBranch.current;
        const versionBranchName = `release/${version}`;
        const branchExists = await git.branch(['-a']).then((branches) => {
            return branches.all.includes(`remotes/origin/${versionBranchName}`);
        });

        if (branchExists) {
            console.log(`Branch ${versionBranchName} already exists.`);
            return;
        }

        try {
            console.log(`Creating branch ${versionBranchName}`);
            console.log(`Applying version ${version}`);
            console.log(`currentBranchName ${currentBranchName}`);

            await git.checkoutBranch(versionBranchName, currentBranchName);

            applyVersion(version);

            await git.add('.');
            await git.commit(`Apply version ${version}`);
            await git.push('origin', versionBranchName);
        } finally {
            await git.checkout(currentBranchName);
        }
    }
}