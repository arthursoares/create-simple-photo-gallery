# create-simple-photo-gallery

Scaffold a [simple-photo-gallery](https://github.com/arthursoares/simple-photo-gallery)
site — a photo gallery for Astro + GitHub Pages where folders are albums and
EXIF writes the captions — without forking:

```bash
npm create simple-photo-gallery@latest my-photos
```

The CLI downloads the template at a pinned release, strips the demo content
(the example photographs are not MIT-licensed), asks a few questions (title,
site shape, chrome, starting content), writes `gallery.config.ts`, installs
dependencies, and initializes git. You're left one push away from a published
GitHub Pages site.

## Flags

Everything can run non-interactively:

```bash
npm create simple-photo-gallery@latest my-photos -- \
  --title "Photos" --mode auto --chrome header --content empty -y
```

| Flag | Values | Default |
| --- | --- | --- |
| `--title` | any string | `Photos` |
| `--mode` | `gallery` · `single` · `auto` | `auto` |
| `--chrome` | `header` · `rail` · `frame` | `header` |
| `--content` | `placeholders` · `empty` | `placeholders` |
| `--ref` | any template git ref | the pinned release tag |
| `--no-install` / `--no-git` | — | install + git on |
| `-y`, `--yes` | accept defaults | — |

## Versioning

Each CLI release pins the template tag it scaffolds (`0.2.x` → template
`v0.2.0`). Use `--ref main` to scaffold from the template's latest commit.

Template, docs, and live demo: https://github.com/arthursoares/simple-photo-gallery

## License

MIT © Arthur Soares
