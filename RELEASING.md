# Releasing

The CLI and the [template](https://github.com/arthursoares/simple-photo-gallery)
version in lockstep: CLI `0.2.x` scaffolds template tag `v0.2.x`
(`TEMPLATE_REF` in `index.mjs`).

## Where updates land

| Audience | How it updates |
| --- | --- |
| Live demo | Automatically — every push to the template's `main` redeploys Pages. |
| New scaffolds (`npm create`) | Only on a release pair (below) — the CLI pins a template tag. |
| Existing forks/scaffolds | Never automatically. Forks can merge upstream; scaffolds apply changes manually. |

## Cutting a release (e.g. 0.2.1)

1. **Template repo** (`simple-photo-gallery`):

   ```bash
   # bump "version" in package.json, commit, then:
   git push && git tag v0.2.1 && git push origin v0.2.1
   gh release create v0.2.1 --title v0.2.1 --notes "…"
   ```

2. **This repo** (`create-simple-photo-gallery`):

   ```bash
   # set TEMPLATE_REF = 'v0.2.1' in index.mjs
   # bump "version" to 0.2.1 in package.json, commit, then:
   git push && git tag v0.2.1 && git push origin v0.2.1
   ```

   The tag push triggers `.github/workflows/publish.yml`, which publishes to
   npm using the `NPM_TOKEN` repository secret (a granular npmjs.com access
   token with read/write on this package).

3. Verify: `npm view create-simple-photo-gallery version`, then
   `npm create simple-photo-gallery@latest /tmp/check -- --content empty --no-install -y`.

Template-only fixes that aren't worth a release reach adventurous users via
`--ref main`.
