import { Octokit } from '@octokit/rest';
import { SemVer } from 'semver';
import simpleGit from 'simple-git';
import { applyVersion } from './apply-version';


const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
});

export async function createVersionBranch(version: string = 'main') {
    if (version !== 'main') {
        const git = simpleGit();
        const currentBranch = await git.branch();
        const currentBranchName = currentBranch.current;
        const versionBranchName = `release/${version}`;

        await git.fetch(['--all', '--prune']);

        const branchExists = await git.branch(['-a']).then((branches) => {
            return branches.all.includes(`remotes/origin/${versionBranchName}`);
        });

        if (branchExists) {
            console.log(`Branch ${versionBranchName} already exists.`);
            return;
        }

        try {
            await git.checkoutBranch(versionBranchName, currentBranchName);

            applyVersion(version);

            await git.add('.');
            await git.commit(`Apply version ${version}`);
            await git.push('origin', versionBranchName);

            const ver = new SemVer(version);

            await octokit.repos.createRelease({
                owner: 'cpdevtools',
                repo: 'common-github-workflows',
                tag_name: `v${version}`,
                target_commitish: versionBranchName,
                name: `Release v${version}`,
                body: `Release v${version}`,
                draft: false,
                prerelease: ver.prerelease.length > 0
            });
        } finally {
            await git.checkout(currentBranchName);
        }
    }
}