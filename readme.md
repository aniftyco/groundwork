# Groundwork

> Scaffold out any project quickly

## Usage

```sh
npx groundwork org/repo path/
```

When first ran, this will fetch and cache `$CACHE/org/repo/{version}.tar.gz` tarball and extract it to `$PWD/path/`. If there are no tagged releases, Groundwork will fallback to the default branch of the repo.

You can pass a hash to the template to specify a commit/branch/tag to scaffold from, for example

```sh
npx groundwork org/repo#development path/
```

And that will fetch and cache `$CACHE/org/repo/development.tar.gz` tarball before extracting it.

You can pass `--force` to force it to redownload the tarball otherwise it will always pull from cache if exists.
