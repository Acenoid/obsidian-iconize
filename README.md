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

Project Deprecation and End of Maintenance: [read more](https://github.com/FlorianWoelki/obsidian-iconize/discussions/646)

## What is it?

This obsidian plugin allows you to add **any** custom icon (of type `.svg`) or from an icon pack to anything you want.

Refer to the official documentation for more information:
[https://florianwoelki.github.io/obsidian-iconize/](https://florianwoelki.github.io/obsidian-iconize/) about the plugin and its functionalities.

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

To customize this project for your needs, you can clone it and then install all dependencies:
```sh
$ git clone https://github.com/FlorianWoelki/obsidian-iconize
$ cd obsidian-iconize
$ pnpm i
```

After the installation, you need to create a `env.js` file in the root directory. Fill the file with the following content:

```js
export const obsidianExportPath =
  '<path-to-obsidian-vault>/.obsidian/plugins/obsidian-iconize/';
```

Make sure you create the directory specified in that variable if it does not exist yet.

Afterwards, you can start the rollup dev server by using:

```sh
$ pnpm dev
```

This command will automatically build the neccesary files for testing and developing on every change. Furthermore, it does copy all the necessary files to the plugin directory you specified.

Finally, you can customize the plugin and add it to your plugins.
