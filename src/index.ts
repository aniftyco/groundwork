import { homedir } from 'os';
import { join, dirname } from 'path';
import { parse } from 'url';
import { existsSync, createWriteStream } from 'fs';
import { get as download } from 'https';
import { Octokit } from '@octokit/core';
import mkdirp from 'mkdirp';
import tar from 'tar';

export class Groundwork {
  private client: Octokit = new Octokit();
  private tarFile: string;
  private tarUrl: string;
  private cacheDir: string;

  constructor(private src: string, private dest: string, private force = false) {
    this.cacheDir = join(homedir(), '.groundwork');
  }

  private async getLatestRelease(src: string): Promise<string> {
    try {
      const { data: release } = await this.client.request(`GET /repos/${src}/releases/latest`);

      return release.tag_name;
    } catch (err) {
      return this.getDefaultBranch(src);
    }
  }

  private async getDefaultBranch(src: string): Promise<string> {
    try {
      const { data: release } = await this.client.request(`GET /repos/${src}`);

      return release.default_branch;
    } catch (err) {
      throw err;
    }
  }

  public async parse() {
    const { pathname: repo, hash: branch } = parse(this.src);
    const release = await this.getLatestRelease(repo);
    const hash = (branch || `#${release}`).slice(1);

    this.tarFile = join(this.cacheDir, repo, `${hash}.tar.gz`);
    this.tarUrl = `https://codeload.github.com/${repo}/tar.gz/${hash}`;
  }

  public async fetch() {
    if (!existsSync(this.tarFile) || this.force) {
      return new Promise((resolve, reject) => {
        download(this.tarUrl, async (response) => {
          if (response.statusCode >= 400) {
            return reject(response);
          }

          await mkdirp(dirname(this.tarFile));

          const stream = createWriteStream(this.tarFile).on('finish', resolve);

          response.pipe(stream);
        }).on('error', reject);
      });
    }
  }

  public async extract() {
    await mkdirp(this.dest);

    await tar.extract({ strip: 1, file: this.tarFile, cwd: this.dest });
  }
}
