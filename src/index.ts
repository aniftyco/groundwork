import { Octokit } from '@octokit/core';
import envPaths from 'env-paths';
import { existsSync } from 'fs';
import { writeFile } from 'fs/promises';
import mkdirp from 'mkdirp';
import { dirname, join } from 'path';
import tar from 'tar';
import { parse } from 'url';

export class Groundwork {
  private cacheDir = envPaths('groundwork', { suffix: 'nodejs' }).cache;
  private client: Octokit;
  private owner: string;
  private repo: string;
  private ref: string;
  private tarFile: string;

  constructor(private src: string, private dest: string, private options = { force: false, auth: null }) {
    this.client = new Octokit({ auth: options.auth });

    const { pathname, hash } = parse(this.src);
    const [owner, repo] = pathname.split('/');

    this.owner = owner;
    this.repo = repo;
    this.ref = hash ? hash.slice(1) : null;
  }

  private async getRef(): Promise<string> {
    if (this.ref) {
      return this.ref;
    }

    try {
      const { data: release } = await this.client.request(`GET /repos/{owner}/{repo}/releases/latest`, {
        owner: this.owner,
        repo: this.repo,
      });

      return release.tag_name;
    } catch (err) {
      return this.getDefaultBranch();
    }
  }

  private async getDefaultBranch(): Promise<string> {
    try {
      const { data: repo } = await this.client.request(`GET /repos/{owner}/{repo}`, {
        owner: this.owner,
        repo: this.repo,
      });

      return repo.default_branch;
    } catch (err) {
      throw err;
    }
  }

  public async fetch(): Promise<void> {
    const ref = await this.getRef();
    this.tarFile = join(this.cacheDir, this.owner, this.repo, `${ref}.tar.gz`);

    if (!existsSync(this.tarFile) || this.options.force) {
      const res = await this.client.request('GET /repos/{owner}/{repo}/tarball/{ref}', {
        owner: this.owner,
        repo: this.repo,
        ref: this.ref,
      });

      if (res.status >= 400) {
        throw new Error(JSON.stringify(res.data));
      }

      await mkdirp(dirname(this.tarFile));
      await writeFile(this.tarFile, Buffer.from(res.data as any));
    }
  }

  public async extract(): Promise<void> {
    await mkdirp(this.dest);
    await tar.extract({ strip: 1, file: this.tarFile, cwd: this.dest });
  }
}
