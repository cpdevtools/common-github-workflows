import simpleGit from 'simple-git';
import { applyVersion } from './apply-version';


export async function createVersionBranch(version: string = 'main') {
    if (version !== 'main') {
        const git = simpleGit();
        const currentBranch = await git.branch();
        const currentBranchName = currentBranch.current;
        const versionBranchName = `release/${currentBranchName}`;
        const branchExists = await git.branch(['-a']).then((branches) => {
            return branches.all.includes(`remotes/origin/${versionBranchName}`);
        });

        if (branchExists) {
            console.log(`Branch ${versionBranchName} already exists.`);
            return;
        }

        await git.checkoutBranch(versionBranchName, currentBranchName);

        applyVersion(version);

        await git.add('.github/**/*.{yml,yaml}');
        await git.commit(`Apply version ${version}`);

        await git.push('origin', versionBranchName);
        await git.checkout(currentBranchName);
    }
}