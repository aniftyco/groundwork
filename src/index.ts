import { homedir } from 'os';
import { join, dirname } from 'path';
import { parse } from 'url';
import { existsSync, createWriteStream } from 'fs';
import { get as download } from 'https';
import mkdirp from 'mkdirp';
import tar from 'tar';

export class Groundwork {
  private tarFile: string;
  private tarUrl: string;

  constructor(src: string, private dest: string, private force = false) {
    const cacheDir = join(homedir(), '.groundwork');
    const { repo, hash } = this.parse(src);

    this.tarFile = join(cacheDir, repo, `${hash}.tar.gz`);
    this.tarUrl = `https://codeload.github.com/${repo}/tar.gz/${hash}`;
  }

  private parse(src: string) {
    const info = parse(src);

    return {
      repo: info.pathname,
      hash: (info.hash || '#master').slice(1),
    };
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
