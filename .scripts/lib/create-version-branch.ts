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
            const isPreRelease = ver.prerelease.length > 0;

            await octokit.repos.createRelease({
                owner: 'cpdevtools',
                repo: 'common-github-workflows',
                tag_name: `v${version}`,
                target_commitish: versionBranchName,
                name: `Release v${version}`,
                body: `Release v${version}`,
                draft: false,
                prerelease: isPreRelease
            });

            const sha = await git.revparse([versionBranchName]);
            if (isPreRelease) {
                await upsertTag(`next`, sha);
            } else {
                await upsertTag(`latest`, sha);
            }

            await upsertTag(`v${ver.major}`, sha);
            await upsertTag(`v${ver.major}.${ver.minor}`, sha);
        } finally {
            await git.checkout(currentBranchName);
        }
    }
}

async function upsertTag(tagName: string, sha: string) {
    try {
        await octokit.git.createRef({
            owner: 'cpdevtools',
            repo: 'common-github-workflows',
            ref: `refs/tags/${tagName}`,
            sha
        });
    } catch (e) {
        await octokit.git.updateRef({
            owner: 'cpdevtools',
            repo: 'common-github-workflows',
            ref: `refs/tags/${tagName}`,
            sha
        });
    }
}
