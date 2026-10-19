# Iconize26

> [!IMPORTANT]
> **Made with AI tools.** All changes on top of the upstream `main` branch were made with AI tools:
>
> - The changes from [LandonSchropp/obsidian-iconize](https://github.com/LandonSchropp/obsidian-iconize) were written by AI agents. According to its author, the code was not read.
> - This fork's own changes were made with the help of [Claude Code](https://claude.com/claude-code).

> [!NOTE]
> **Iconize26 is a fork** of [FlorianWoelki/obsidian-iconize](https://github.com/FlorianWoelki/obsidian-iconize), which is no longer maintained.
> It is based on the unreleased upstream `main` branch and includes:
>
> - All unreleased upstream changes, e.g. the reworked icon pack manager and the fix for certain characters like `©` freezing Obsidian ([#647](https://github.com/FlorianWoelki/obsidian-iconize/pull/647)).
> - The fixes and features of [LandonSchropp/obsidian-iconize](https://github.com/LandonSchropp/obsidian-iconize), mainly for vaults that are synced across devices: a running instance no longer overwrites a newer synced `data.json`, icons reload when `data.json` changes on disk, and a folder note's icon can be used as its folder's icon.
> - Icons in notes are also rendered in content that other plugins render asynchronously, e.g. the options of a [Meta Bind](https://github.com/mProjectsCode/obsidian-meta-bind-plugin) select input field (Meta Bind >= 1.3.2, see [meta-bind#504](https://github.com/mProjectsCode/obsidian-meta-bind-plugin/issues/504)).
>
> It uses its own plugin id `obsidian-icon26-folder`, so Obsidian never replaces it with an official Iconize update.
> Install it with [BRAT](https://github.com/TfTHacker/obsidian42-brat) (`Acenoid/obsidian-iconize`) or copy `main.js`, `manifest.json` and `styles.css` of a release into `.obsidian/plugins/obsidian-icon26-folder/`.
>
> **Switching from Iconize:** never enable both plugins at the same time, otherwise every icon is shown twice.
>
> 1. Disable Iconize under Settings → Community plugins.
> 2. Copy `data.json` from `.obsidian/plugins/obsidian-icon-folder/` into `.obsidian/plugins/obsidian-icon26-folder/`.
> 3. If `iconPacksPath` in the copied `data.json` points into the old plugin folder (e.g. `.obsidian/plugins/obsidian-icon-folder/icons`), also copy that folder into the new plugin folder and change `iconPacksPath` accordingly (e.g. `.obsidian/plugins/obsidian-icon26-folder/icons`). With the default `.obsidian/icons` nothing needs to be done.
> 4. Reload the list of community plugins and enable Iconize26. Custom hotkeys for Iconize commands need to be set again.

![Preview Image](./docs/preview-image.png)

The original Iconize reached its end of maintenance: [read more](https://github.com/FlorianWoelki/obsidian-iconize/discussions/646)

## What is it?

This obsidian plugin allows you to add **any** custom icon (of type `.svg`) or from an icon pack to anything you want.

The documentation of the original plugin also applies to Iconize26:
[https://florianwoelki.github.io/obsidian-iconize/](https://florianwoelki.github.io/obsidian-iconize/). Where it mentions the plugin folder `obsidian-icon-folder`, Iconize26 uses `obsidian-icon26-folder`.

## Key Highlights

[Icons before file/folder name](https://florianwoelki.github.io/obsidian-iconize/files-and-folders/icon-before-file-or-folder.html),
[Icons in notes](https://florianwoelki.github.io/obsidian-iconize/notes/icons-in-notes.html),
[Icon above title](https://florianwoelki.github.io/obsidian-iconize/notes/title-icon.html),
[Predefined icon packs](https://florianwoelki.github.io/obsidian-iconize/guide/icon-packs.html),
[Icons in tabs](https://florianwoelki.github.io/obsidian-iconize/files-and-folders/icon-tabs.html),
[Customizable settings](https://florianwoelki.github.io/obsidian-iconize/guide/settings.html),
[Custom rules](https://florianwoelki.github.io/obsidian-iconize/files-and-folders/custom-rules.html),
[Frontmatter integration](https://florianwoelki.github.io/obsidian-iconize/files-and-folders/use-frontmatter.html),
[Change color of an individual icon](https://florianwoelki.github.io/obsidian-iconize/files-and-folders/individual-icon-color.html),

## Development

To work on this fork, clone it and install all dependencies with pnpm 12. Older versions such as pnpm 9 cannot read `pnpm-workspace.yaml`.

```sh
git clone https://github.com/Acenoid/obsidian-iconize
cd obsidian-iconize
npx pnpm@12 install
```

Then create an `env.js` file in the root directory with the folder the plugin files are copied to:

```js
export const obsidianExportPath =
  '<path-to-obsidian-vault>/.obsidian/plugins/obsidian-icon26-folder/';
```

Make sure the folder exists. Then start the rollup dev server:

```sh
npx pnpm@12 dev
```

It builds the plugin on every change and copies the files into that folder. Reload the plugin in Obsidian to see the changes.

`npx pnpm@12 test` runs the unit tests, `npx pnpm@12 build` creates a production build without a source map.
