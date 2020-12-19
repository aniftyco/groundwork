import { homedir } from 'os';
import { join, dirname } from 'path';
import { parse } from 'url';
import { existsSync, createWriteStream } from 'fs';
import { get as download } from 'https';
import { Octokit } from '@octokit/core';
import mkdirp from 'mkdirp';
import tar from 'tar';

export class Groundwork {
  private tarFile: string;
  private tarUrl: string;
  private src: string;
  private cacheDir: string;
  private initializationPromise: any;

  constructor(src: string, private dest: string, private force = false) {
    this.cacheDir = join(homedir(), '.groundwork');
    this.src = src;
  }

  private async doInitialize() {
    const { repo, hash }: {repo: string; hash: string} = await this.parse(this.src);

    this.tarFile = join(this.cacheDir, repo, `${hash}.tar.gz`);
    this.tarUrl = `https://codeload.github.com/${repo}/tar.gz/${hash}`;
  }

  private async initialize() {
    if (!this.initializationPromise) {
      this.initializationPromise = this.doInitialize();
    }
    return this.initializationPromise;
  }

  private async parse(src: string) {
    const info = parse(src);
    const hash = await this.getLatestRelease(info.pathname);

    return {
      repo: info.pathname,
      hash: (info.hash || `#${hash}`).slice(1),
    };
  }

  private async getLatestRelease(src: string): Promise<string> {
    const octokit = new Octokit();

    try {
      const release = await octokit.request(
        `GET /repos/${src}/releases/latest`
      );
  
      return release.data.tag_name;
    } catch(err) {
      return this.getDefaultBranch(src);
    }
  }

  private async getDefaultBranch(src: string): Promise<string> {
    const octokit = new Octokit();

    try {
      const release = await octokit.request(
        `GET /repos/${src}`
      );
  
      return release.data.default_branch;
    } catch(err) {
      throw err;
    }
  }

  public async fetch() {
    await this.initialize();

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
