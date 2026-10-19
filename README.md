# Iconize26

Iconize26 adds icons to files, folders, notes, tabs and titles in Obsidian.
It is a fork of [Iconize](https://github.com/FlorianWoelki/obsidian-iconize) by Florian Woelki, which is [no longer maintained](https://github.com/FlorianWoelki/obsidian-iconize/discussions/646).

> [!IMPORTANT]
> **Made with AI tools.** The changes from [LandonSchropp/obsidian-iconize](https://github.com/LandonSchropp/obsidian-iconize) were written by AI agents, and according to its author, the code was not read.
> This fork's own changes were made with the help of [Claude Code](https://claude.com/claude-code).

![Preview Image](./docs/preview-image.png)

## What's different from Iconize

- **All unreleased changes of Iconize**, e.g. the reworked icon pack manager and the fix for `©` freezing Obsidian ([#647](https://github.com/FlorianWoelki/obsidian-iconize/pull/647)).
- **Better sync** from [LandonSchropp/obsidian-iconize](https://github.com/LandonSchropp/obsidian-iconize): a running Obsidian no longer overwrites a newer synced `data.json`, icons reload when it changes, and a folder note's icon is shown on its folder.
- **Icons in content that other plugins render later**, e.g. the options of a [Meta Bind](https://github.com/mProjectsCode/obsidian-meta-bind-plugin) select input (Meta Bind 1.3.2 and newer, see [meta-bind#504](https://github.com/mProjectsCode/obsidian-meta-bind-plugin/issues/504)).
- **Check and repair icons:** a button in the settings takes over the icons from the frontmatter of all notes and cleans up `data.json`.
- **Its own plugin id** `obsidian-icon26-folder`, so Obsidian never replaces it with an Iconize update.

## Installation

Add `Acenoid/obsidian-iconize` with [BRAT](https://github.com/TfTHacker/obsidian42-brat), or copy `main.js`, `manifest.json` and `styles.css` of the latest release into `.obsidian/plugins/obsidian-icon26-folder/`.

## Switching from Iconize

Never enable both plugins at the same time, otherwise every icon is shown twice.

1. Disable Iconize under Settings → Community plugins.
2. Before enabling Iconize26 for the first time, copy `data.json` from `.obsidian/plugins/obsidian-icon-folder/` into `.obsidian/plugins/obsidian-icon26-folder/`.
3. Only if your icon packs are in the old plugin folder (`iconPacksPath` in `data.json` is `.obsidian/plugins/obsidian-icon-folder/icons`): copy the `icons` folder as well and change `iconPacksPath` to `.obsidian/plugins/obsidian-icon26-folder/icons`.
4. Enable Iconize26. It shows a warning if Iconize is still enabled or the icon packs are still in its folder.
5. If you set icons in the frontmatter, click "Check and repair icons" in the settings of Iconize26.

Custom hotkeys for Iconize commands need to be set again.

## Documentation

The [documentation of Iconize](https://florianwoelki.github.io/obsidian-iconize/) also applies to Iconize26. Where it mentions the plugin folder `obsidian-icon-folder`, Iconize26 uses `obsidian-icon26-folder`.

Features:
[icons before file and folder names](https://florianwoelki.github.io/obsidian-iconize/files-and-folders/icon-before-file-or-folder.html),
[icons in notes](https://florianwoelki.github.io/obsidian-iconize/notes/icons-in-notes.html),
[icon above the title](https://florianwoelki.github.io/obsidian-iconize/notes/title-icon.html),
[predefined icon packs](https://florianwoelki.github.io/obsidian-iconize/guide/icon-packs.html),
[icons in tabs](https://florianwoelki.github.io/obsidian-iconize/files-and-folders/icon-tabs.html),
[settings](https://florianwoelki.github.io/obsidian-iconize/guide/settings.html),
[custom rules](https://florianwoelki.github.io/obsidian-iconize/files-and-folders/custom-rules.html),
[frontmatter](https://florianwoelki.github.io/obsidian-iconize/files-and-folders/use-frontmatter.html),
[color of a single icon](https://florianwoelki.github.io/obsidian-iconize/files-and-folders/individual-icon-color.html).

## Development

Install the dependencies with pnpm 12. Older versions cannot read `pnpm-workspace.yaml`.

```sh
git clone https://github.com/Acenoid/obsidian-iconize
cd obsidian-iconize
npx pnpm@12 install
```

Create a file `env.js` with the plugin folder of a test vault. The folder must exist.

```js
export const obsidianExportPath =
  '<path-to-obsidian-vault>/.obsidian/plugins/obsidian-icon26-folder/';
```

- `npx pnpm@12 dev` builds the plugin on every change and copies it into that folder. Reload the plugin in Obsidian to see the changes.
- `npx pnpm@12 test` runs the unit tests.
- `npx pnpm@12 build` creates a production build in that folder.
