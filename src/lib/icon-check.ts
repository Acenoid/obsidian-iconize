import emoji from '@app/emoji';
import { getNormalizedName } from '@app/icon-pack-manager/util';
import { isHexadecimal, stringToHex } from '@app/util';

/**
 * A Markdown note as the metadata cache sees it. `frontmatter` is `null` when
 * Obsidian has not indexed the note yet, and `undefined` when the note has no
 * frontmatter.
 */
export interface IconCheckNote {
  path: string;
  frontmatter: Record<string, unknown> | undefined | null;
}

/**
 * Whether an icon can be found: in its icon pack, or not because the icon pack
 * or the icon in it is missing.
 */
export type IconAvailability = 'available' | 'missing-pack' | 'missing-icon';

export interface IconCheckInput {
  /** The content of `data.json`: path entries and `settings`. */
  data: Record<string, unknown>;
  /**
   * All Markdown notes of the vault, or `undefined` when icons from the
   * frontmatter are disabled. The notes are then not checked.
   */
  notes?: IconCheckNote[];
  iconFieldName: string;
  iconColorFieldName: string;
  /** Returns whether a file or folder exists in the vault. */
  pathExists: (path: string) => boolean;
  getIconAvailability: (iconName: string) => IconAvailability;
  /** Returns whether an icon is shown anyway, e.g. from its stored SVG. */
  isIconShown: (iconName: string) => boolean;
  rules: { rule: string; icon: string }[];
  /** Warnings about the settings that are added to the report as they are. */
  warnings: string[];
}

export interface IconCheckItem {
  path: string;
  icon?: string;
  detail?: string;
}

export interface IconProblem {
  icon: string;
  /** Paths and custom rules that use the icon. */
  usedBy: string[];
  shown: boolean;
}

export interface IconCheckReport {
  checkedNotes: number;
  checkedEntries: number;
  frontmatterDisabled: boolean;
  added: IconCheckItem[];
  updated: IconCheckItem[];
  removedWithoutFrontmatter: IconCheckItem[];
  removedMissingPath: IconCheckItem[];
  removedInvalid: IconCheckItem[];
  invalidFrontmatter: IconCheckItem[];
  missingIconPacks: IconProblem[];
  missingIcons: IconProblem[];
  notIndexed: string[];
  errors: IconCheckItem[];
  warnings: string[];
}

export interface IconCheckResult {
  report: IconCheckReport;
  /** The repaired content of `data.json`. */
  data: Record<string, unknown>;
  /** Paths whose icon was added or changed. */
  changedPaths: string[];
  /** Paths whose entry was removed, with the icon they had, if any. */
  removedEntries: IconCheckItem[];
  /** Whether `data.json` has to be written. */
  hasChanges: boolean;
}

/** Keys of `data.json` that are no path entries. */
const NON_PATH_KEYS = new Set(['settings', 'migrated']);

/**
 * Returns the icon name of a path entry, or `undefined` if the entry is
 * invalid.
 */
const getEntryIcon = (value: unknown): string | undefined => {
  const iconName =
    typeof value === 'object' && value !== null
      ? (value as { iconName?: unknown }).iconName
      : value;
  return typeof iconName === 'string' && iconName.trim() !== ''
    ? iconName
    : undefined;
};

const getEntryColor = (value: unknown): string | undefined => {
  const iconColor =
    typeof value === 'object' && value !== null
      ? (value as { iconColor?: unknown }).iconColor
      : undefined;
  return typeof iconColor === 'string' ? iconColor : undefined;
};

const toEntry = (
  iconName: string,
  iconColor: string | undefined,
): string | { iconName: string; iconColor: string } =>
  iconColor ? { iconName, iconColor } : iconName;

const describeChange = (
  oldIcon: string,
  oldColor: string | undefined,
  newIcon: string,
  newColor: string | undefined,
): string => {
  const changes: string[] = [];
  if (oldIcon !== newIcon) {
    changes.push(`icon ${oldIcon} → ${newIcon}`);
  }
  if (oldColor !== newColor) {
    changes.push(`color ${oldColor ?? 'none'} → ${newColor ?? 'none'}`);
  }
  return changes.join(', ');
};

const createReport = (input: IconCheckInput): IconCheckReport => ({
  checkedNotes: input.notes?.length ?? 0,
  checkedEntries: Object.keys(input.data).filter(
    (key) => !NON_PATH_KEYS.has(key),
  ).length,
  frontmatterDisabled: input.notes === undefined,
  added: [],
  updated: [],
  removedWithoutFrontmatter: [],
  removedMissingPath: [],
  removedInvalid: [],
  invalidFrontmatter: [],
  missingIconPacks: [],
  missingIcons: [],
  notIndexed: [],
  errors: [],
  warnings: [...input.warnings],
});

/**
 * Checks the icon entries of `data.json` against the frontmatter of the notes
 * and the vault, and returns the repaired data together with a report.
 *
 * - Notes: the icon and color from the frontmatter win. Entries of notes
 *   without an icon in the frontmatter are removed. Notes with an invalid
 *   frontmatter property or that are not indexed yet are left unchanged.
 * - All entries: invalid entries and entries of paths that no longer exist are
 *   removed.
 * - Icons of entries and custom rules whose icon pack or icon is missing are
 *   only reported.
 *
 * Errors in single notes are caught and reported, so the check always finishes.
 */
export const checkIcons = (input: IconCheckInput): IconCheckResult => {
  const data = { ...input.data };
  const report = createReport(input);
  const changedPaths = new Set<string>();
  const removedEntries: IconCheckItem[] = [];

  const removeEntry = (path: string, list: IconCheckItem[]): void => {
    const item = { path, icon: getEntryIcon(data[path]) };
    delete data[path];
    changedPaths.delete(path);
    list.push(item);
    removedEntries.push(item);
  };

  for (const note of input.notes ?? []) {
    try {
      if (note.frontmatter === null) {
        report.notIndexed.push(note.path);
        continue;
      }

      const frontmatter = note.frontmatter ?? {};
      const rawIcon = frontmatter[input.iconFieldName];
      const rawColor = frontmatter[input.iconColorFieldName];
      if (
        rawIcon !== undefined &&
        rawIcon !== null &&
        typeof rawIcon !== 'string'
      ) {
        report.invalidFrontmatter.push({
          path: note.path,
          detail: `\`${input.iconFieldName}\` is not text`,
        });
        continue;
      }
      if (rawColor && typeof rawColor !== 'string') {
        report.invalidFrontmatter.push({
          path: note.path,
          detail: `\`${input.iconColorFieldName}\` is not text`,
        });
        continue;
      }

      const current = data[note.path];
      const currentIcon = getEntryIcon(current);
      const iconName = typeof rawIcon === 'string' ? rawIcon.trim() : '';
      if (!iconName) {
        if (note.path in data) {
          removeEntry(
            note.path,
            currentIcon
              ? report.removedWithoutFrontmatter
              : report.removedInvalid,
          );
        }
        continue;
      }

      const newIcon = getNormalizedName(iconName);
      const color = typeof rawColor === 'string' ? rawColor.trim() : '';
      const newColor = !color
        ? undefined
        : isHexadecimal(color)
          ? stringToHex(color)
          : color;

      if (!currentIcon) {
        data[note.path] = toEntry(newIcon, newColor);
        changedPaths.add(note.path);
        report.added.push({ path: note.path, icon: newIcon });
        continue;
      }

      const currentColor = getEntryColor(current);
      if (currentIcon !== newIcon || currentColor !== newColor) {
        data[note.path] = toEntry(newIcon, newColor);
        changedPaths.add(note.path);
        report.updated.push({
          path: note.path,
          icon: newIcon,
          detail: describeChange(currentIcon, currentColor, newIcon, newColor),
        });
      }
    } catch (error) {
      report.errors.push({ path: note.path, detail: String(error) });
    }
  }

  for (const path of Object.keys(data)) {
    if (NON_PATH_KEYS.has(path)) {
      continue;
    }

    if (!getEntryIcon(data[path])) {
      removeEntry(path, report.removedInvalid);
    } else if (!input.pathExists(path)) {
      removeEntry(path, report.removedMissingPath);
    }
  }

  const usedBy = new Map<string, string[]>();
  const addUsage = (iconName: string, usage: string): void => {
    if (!emoji.isEmoji(iconName)) {
      usedBy.set(iconName, [...(usedBy.get(iconName) ?? []), usage]);
    }
  };
  for (const [path, value] of Object.entries(data)) {
    if (!NON_PATH_KEYS.has(path)) {
      addUsage(getEntryIcon(value), path);
    }
  }
  for (const rule of input.rules) {
    addUsage(rule.icon, `Custom rule: ${rule.rule}`);
  }

  for (const [iconName, paths] of usedBy) {
    const availability = input.getIconAvailability(iconName);
    if (availability !== 'available') {
      (availability === 'missing-pack'
        ? report.missingIconPacks
        : report.missingIcons
      ).push({
        icon: iconName,
        usedBy: paths,
        shown: input.isIconShown(iconName),
      });
    }
  }

  return {
    report,
    data,
    changedPaths: [...changedPaths],
    removedEntries,
    hasChanges: changedPaths.size > 0 || removedEntries.length > 0,
  };
};

/**
 * Returns the sentences that summarize the report: what was checked and
 * changed.
 */
export const getReportSummary = (report: IconCheckReport): string[] => {
  const summary = report.frontmatterDisabled
    ? [
        `Checked ${report.checkedEntries} entries of data.json. Notes were not checked because "Use icon in frontmatter" is disabled.`,
      ]
    : [
        `Checked ${report.checkedNotes} notes and ${report.checkedEntries} entries of data.json.`,
      ];

  const removed =
    report.removedWithoutFrontmatter.length +
    report.removedMissingPath.length +
    report.removedInvalid.length;
  if (report.added.length + report.updated.length + removed > 0) {
    summary.push(
      `Added: ${report.added.length}, updated: ${report.updated.length}, removed: ${removed}. The previous data.json was saved as data.json.bak.`,
    );
  } else if (getReportSections(report).length === 0) {
    summary.push('Everything is fine, nothing was changed.');
  } else {
    summary.push('Nothing was changed.');
  }

  return summary;
};

export interface IconCheckSection {
  title: string;
  items: string[];
}

/**
 * Returns the sections of the report that have entries, each with a title and
 * one line per item.
 */
export const getReportSections = (
  report: IconCheckReport,
): IconCheckSection[] => {
  const describeItem = (item: IconCheckItem): string =>
    [
      item.path,
      item.icon && `(${item.icon})`,
      item.detail && `– ${item.detail}`,
    ]
      .filter(Boolean)
      .join(' ');
  const describeProblem = (problem: IconProblem): string =>
    `${problem.icon} – ${problem.shown ? 'still shown from the stored SVG' : 'not shown'} – used by: ${problem.usedBy.join(', ')}`;

  return [
    {
      title: 'Added from the frontmatter',
      items: report.added.map(describeItem),
    },
    {
      title: 'Updated from the frontmatter',
      items: report.updated.map(describeItem),
    },
    {
      title: 'Removed: notes without an icon in the frontmatter',
      items: report.removedWithoutFrontmatter.map(describeItem),
    },
    {
      title: 'Removed: files and folders that no longer exist',
      items: report.removedMissingPath.map(describeItem),
    },
    {
      title: 'Removed: invalid entries',
      items: report.removedInvalid.map(describeItem),
    },
    {
      title: 'Not changed: invalid frontmatter',
      items: report.invalidFrontmatter.map(describeItem),
    },
    {
      title: 'Icon pack not installed',
      items: report.missingIconPacks.map(describeProblem),
    },
    {
      title: 'Icon not found in its icon pack',
      items: report.missingIcons.map(describeProblem),
    },
    {
      title: 'Skipped: notes Obsidian has not indexed yet',
      items: report.notIndexed,
    },
    {
      title: 'Errors',
      items: report.errors.map(describeItem),
    },
  ].filter((section) => section.items.length > 0);
};
