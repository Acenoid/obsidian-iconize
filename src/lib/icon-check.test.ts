import { describe, expect, it } from 'vitest';
import {
  IconCheckInput,
  IconCheckReport,
  checkIcons,
  getReportSections,
  getReportSummary,
} from './icon-check';

const createInput = (input: Partial<IconCheckInput> = {}): IconCheckInput => ({
  data: { settings: {} },
  notes: [],
  iconFieldName: 'icon',
  iconColorFieldName: 'iconColor',
  pathExists: () => true,
  getIconAvailability: () => 'available',
  isIconShown: () => false,
  rules: [],
  warnings: [],
  ...input,
});

describe('checkIcons', () => {
  describe('notes', () => {
    it('adds the icon of a note that has no entry', () => {
      const result = checkIcons(
        createInput({
          notes: [{ path: 'NPC.md', frontmatter: { icon: 'RiUserFill' } }],
        }),
      );

      expect(result.data['NPC.md']).toBe('RiUserFill');
      expect(result.report.added).toEqual([
        { path: 'NPC.md', icon: 'RiUserFill' },
      ]);
      expect(result.changedPaths).toEqual(['NPC.md']);
      expect(result.hasChanges).toBe(true);
    });

    it('stores the color with the icon and converts hexadecimal colors', () => {
      const result = checkIcons(
        createInput({
          notes: [
            {
              path: 'NPC.md',
              frontmatter: { icon: 'RiUserFill', iconColor: 'ff0000' },
            },
            {
              path: 'Ship.md',
              frontmatter: { icon: 'RiSpaceShipFill', iconColor: 'red' },
            },
          ],
        }),
      );

      expect(result.data['NPC.md']).toEqual({
        iconName: 'RiUserFill',
        iconColor: '#ff0000',
      });
      expect(result.data['Ship.md']).toEqual({
        iconName: 'RiSpaceShipFill',
        iconColor: 'red',
      });
    });

    it('normalizes the icon name like icons set in the editor', () => {
      const result = checkIcons(
        createInput({
          notes: [{ path: 'NPC.md', frontmatter: { icon: 'RiUserFill.svg' } }],
        }),
      );

      expect(result.data['NPC.md']).toBe('RiUserFill');
    });

    it('replaces an invalid entry of a note with the icon of its frontmatter', () => {
      const result = checkIcons(
        createInput({
          data: { settings: {}, 'NPC.md': { iconName: null } },
          notes: [{ path: 'NPC.md', frontmatter: { icon: 'RiUserFill' } }],
        }),
      );

      expect(result.data['NPC.md']).toBe('RiUserFill');
      expect(result.report.added).toHaveLength(1);
      expect(result.report.removedInvalid).toEqual([]);
    });

    it('keeps an entry that matches the frontmatter', () => {
      const result = checkIcons(
        createInput({
          data: {
            settings: {},
            'NPC.md': { iconName: 'RiUserFill' },
            'Ship.md': { iconName: 'RiSpaceShipFill', iconColor: '#ff0000' },
          },
          notes: [
            { path: 'NPC.md', frontmatter: { icon: 'RiUserFill' } },
            {
              path: 'Ship.md',
              frontmatter: { icon: 'RiSpaceShipFill', iconColor: 'ff0000' },
            },
          ],
        }),
      );

      expect(result.data['NPC.md']).toEqual({ iconName: 'RiUserFill' });
      expect(result.hasChanges).toBe(false);
      expect(getReportSections(result.report)).toEqual([]);
    });

    it('takes over a different icon from the frontmatter', () => {
      const result = checkIcons(
        createInput({
          data: { settings: {}, 'NPC.md': 'LiUser' },
          notes: [{ path: 'NPC.md', frontmatter: { icon: 'RiUserFill' } }],
        }),
      );

      expect(result.data['NPC.md']).toBe('RiUserFill');
      expect(result.report.updated).toEqual([
        {
          path: 'NPC.md',
          icon: 'RiUserFill',
          detail: 'icon LiUser → RiUserFill',
        },
      ]);
    });

    it('takes over the color from the frontmatter and removes a color it does not have', () => {
      const result = checkIcons(
        createInput({
          data: {
            settings: {},
            'NPC.md': 'RiUserFill',
            'Ship.md': { iconName: 'RiSpaceShipFill', iconColor: '#ff0000' },
          },
          notes: [
            {
              path: 'NPC.md',
              frontmatter: { icon: 'RiUserFill', iconColor: '#00ff00' },
            },
            { path: 'Ship.md', frontmatter: { icon: 'RiSpaceShipFill' } },
          ],
        }),
      );

      expect(result.data['NPC.md']).toEqual({
        iconName: 'RiUserFill',
        iconColor: '#00ff00',
      });
      expect(result.data['Ship.md']).toBe('RiSpaceShipFill');
      expect(result.report.updated.map((item) => item.detail)).toEqual([
        'color none → #00ff00',
        'color #ff0000 → none',
      ]);
    });

    it('removes the entry of a note without an icon in the frontmatter', () => {
      const result = checkIcons(
        createInput({
          data: {
            settings: {},
            'NPC.md': 'RiUserFill',
            'Ship.md': 'RiSpaceShipFill',
            'Empty.md': 'LiFile',
          },
          notes: [
            { path: 'NPC.md', frontmatter: undefined },
            { path: 'Ship.md', frontmatter: { icon: '  ' } },
            { path: 'Empty.md', frontmatter: { icon: null } },
            { path: 'Other.md', frontmatter: {} },
          ],
        }),
      );

      expect(result.data).toEqual({ settings: {} });
      expect(result.report.removedWithoutFrontmatter).toEqual([
        { path: 'NPC.md', icon: 'RiUserFill' },
        { path: 'Ship.md', icon: 'RiSpaceShipFill' },
        { path: 'Empty.md', icon: 'LiFile' },
      ]);
      expect(result.removedEntries).toHaveLength(3);
    });

    it('removes an invalid entry of a note without an icon in the frontmatter', () => {
      const result = checkIcons(
        createInput({
          data: { settings: {}, 'NPC.md': '' },
          notes: [{ path: 'NPC.md', frontmatter: {} }],
        }),
      );

      expect(result.report.removedInvalid).toEqual([
        { path: 'NPC.md', icon: undefined },
      ]);
      expect(result.report.removedWithoutFrontmatter).toEqual([]);
    });

    it('leaves notes with invalid frontmatter properties unchanged', () => {
      const result = checkIcons(
        createInput({
          data: { settings: {}, 'NPC.md': 'RiUserFill', 'Ship.md': 'LiShip' },
          notes: [
            { path: 'NPC.md', frontmatter: { icon: ['RiUserFill'] } },
            {
              path: 'Ship.md',
              frontmatter: { icon: 'RiSpaceShipFill', iconColor: 5 },
            },
          ],
        }),
      );

      expect(result.data['NPC.md']).toBe('RiUserFill');
      expect(result.data['Ship.md']).toBe('LiShip');
      expect(result.report.invalidFrontmatter).toEqual([
        { path: 'NPC.md', detail: '`icon` is not text' },
        { path: 'Ship.md', detail: '`iconColor` is not text' },
      ]);
      expect(result.hasChanges).toBe(false);
    });

    it('skips notes that are not indexed yet', () => {
      const result = checkIcons(
        createInput({
          data: { settings: {}, 'NPC.md': 'RiUserFill' },
          notes: [{ path: 'NPC.md', frontmatter: null }],
        }),
      );

      expect(result.data['NPC.md']).toBe('RiUserFill');
      expect(result.report.notIndexed).toEqual(['NPC.md']);
    });

    it('reports errors in single notes and checks the other notes', () => {
      const frontmatter = {};
      Object.defineProperty(frontmatter, 'icon', {
        get: () => {
          throw new Error('broken');
        },
      });

      const result = checkIcons(
        createInput({
          notes: [
            { path: 'Broken.md', frontmatter },
            { path: 'NPC.md', frontmatter: { icon: 'RiUserFill' } },
          ],
        }),
      );

      expect(result.report.errors).toEqual([
        { path: 'Broken.md', detail: 'Error: broken' },
      ]);
      expect(result.data['NPC.md']).toBe('RiUserFill');
    });

    it('uses the configured frontmatter field names', () => {
      const result = checkIcons(
        createInput({
          notes: [
            {
              path: 'NPC.md',
              frontmatter: { symbol: 'RiUserFill', symbolColor: 'red' },
            },
          ],
          iconFieldName: 'symbol',
          iconColorFieldName: 'symbolColor',
        }),
      );

      expect(result.data['NPC.md']).toEqual({
        iconName: 'RiUserFill',
        iconColor: 'red',
      });
    });

    it('does not check notes when icons from the frontmatter are disabled', () => {
      const result = checkIcons(
        createInput({
          data: { settings: {}, 'NPC.md': 'RiUserFill' },
          notes: undefined,
        }),
      );

      expect(result.data['NPC.md']).toBe('RiUserFill');
      expect(result.report.frontmatterDisabled).toBe(true);
      expect(result.report.checkedNotes).toBe(0);
    });
  });

  describe('entries', () => {
    it('removes invalid entries', () => {
      const result = checkIcons(
        createInput({
          data: {
            settings: {},
            Empty: '',
            NoName: { iconName: null, iconColor: '#ff0000' },
            Number: 5,
            Null: null,
          },
        }),
      );

      expect(result.data).toEqual({ settings: {} });
      expect(result.report.removedInvalid.map((item) => item.path)).toEqual([
        'Empty',
        'NoName',
        'Number',
        'Null',
      ]);
    });

    it('removes entries of files and folders that no longer exist', () => {
      const result = checkIcons(
        createInput({
          data: {
            settings: {},
            Traveller: 'RiSpaceShipFill',
            'Moved.md': { iconName: 'LiNetwork' },
          },
          pathExists: (path) => path === 'Traveller',
        }),
      );

      expect(result.data).toEqual({
        settings: {},
        Traveller: 'RiSpaceShipFill',
      });
      expect(result.report.removedMissingPath).toEqual([
        { path: 'Moved.md', icon: 'LiNetwork' },
      ]);
    });

    it('keeps the keys that are no path entries', () => {
      const result = checkIcons(
        createInput({
          data: { settings: { fontSize: 16 }, migrated: true },
          pathExists: () => false,
        }),
      );

      expect(result.data).toEqual({
        settings: { fontSize: 16 },
        migrated: true,
      });
      expect(result.report.checkedEntries).toBe(0);
      expect(result.hasChanges).toBe(false);
    });

    it('does not change the input data', () => {
      const data = { settings: {}, Moved: 'LiFolder' };

      checkIcons(createInput({ data, pathExists: () => false }));

      expect(data).toEqual({ settings: {}, Moved: 'LiFolder' });
    });
  });

  describe('icons', () => {
    it('reports icons whose icon pack or icon is missing', () => {
      const result = checkIcons(
        createInput({
          data: {
            settings: {},
            GM: 'IbTrayStacked',
            Z_attachments: 'IbPhotoAndVideo',
            Archive: 'IbTrayStacked',
            'NPC.md': 'RiUnknown',
            'Ship.md': 'RiSpaceShipFill',
            'Smile.md': '😀',
          },
          rules: [{ rule: 'Draft', icon: 'IbTrayStacked' }],
          getIconAvailability: (iconName) =>
            iconName.startsWith('Ib')
              ? 'missing-pack'
              : iconName === 'RiUnknown'
                ? 'missing-icon'
                : 'available',
          isIconShown: (iconName) => iconName === 'IbTrayStacked',
        }),
      );

      expect(result.report.missingIconPacks).toEqual([
        {
          icon: 'IbTrayStacked',
          usedBy: ['GM', 'Archive', 'Custom rule: Draft'],
          shown: true,
        },
        { icon: 'IbPhotoAndVideo', usedBy: ['Z_attachments'], shown: false },
      ]);
      expect(result.report.missingIcons).toEqual([
        { icon: 'RiUnknown', usedBy: ['NPC.md'], shown: false },
      ]);
      expect(result.hasChanges).toBe(false);
    });

    it('checks the icons after the repair', () => {
      const result = checkIcons(
        createInput({
          data: { settings: {}, Moved: 'IbTrayStacked' },
          notes: [{ path: 'NPC.md', frontmatter: { icon: 'IbEarth' } }],
          pathExists: (path) => path !== 'Moved',
          getIconAvailability: () => 'missing-pack',
        }),
      );

      expect(result.report.missingIconPacks.map((p) => p.icon)).toEqual([
        'IbEarth',
      ]);
    });
  });

  it('copies the warnings into the report', () => {
    const result = checkIcons(createInput({ warnings: ['Check the path.'] }));

    expect(result.report.warnings).toEqual(['Check the path.']);
  });
});

const emptyReport: IconCheckReport = {
  checkedNotes: 0,
  checkedEntries: 0,
  frontmatterDisabled: false,
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
  warnings: [],
};

describe('getReportSummary', () => {
  it('says that everything is fine when nothing was found', () => {
    expect(
      getReportSummary({
        ...emptyReport,
        checkedNotes: 83,
        checkedEntries: 103,
      }),
    ).toEqual([
      'Checked 83 notes and 103 entries of data.json.',
      'Everything is fine, nothing was changed.',
    ]);
  });

  it('counts the changes and names the backup', () => {
    expect(
      getReportSummary({
        ...emptyReport,
        added: [{ path: 'A.md' }, { path: 'B.md' }],
        updated: [{ path: 'C.md' }],
        removedWithoutFrontmatter: [{ path: 'D.md' }],
        removedMissingPath: [{ path: 'E' }],
        removedInvalid: [{ path: 'F' }],
      })[1],
    ).toBe(
      'Added: 2, updated: 1, removed: 3. The previous data.json was saved as data.json.bak.',
    );
  });

  it('says that nothing was changed when only problems were found', () => {
    expect(
      getReportSummary({ ...emptyReport, notIndexed: ['New.md'] })[1],
    ).toBe('Nothing was changed.');
  });

  it('says that notes were not checked when the frontmatter is disabled', () => {
    expect(
      getReportSummary({
        ...emptyReport,
        frontmatterDisabled: true,
        checkedEntries: 4,
      })[0],
    ).toBe(
      'Checked 4 entries of data.json. Notes were not checked because "Use icon in frontmatter" is disabled.',
    );
  });
});

describe('getReportSections', () => {
  it('returns no sections for an empty report', () => {
    expect(getReportSections(emptyReport)).toEqual([]);
  });

  it('returns one line per item for the sections with items', () => {
    const sections = getReportSections({
      ...emptyReport,
      added: [{ path: 'NPC.md', icon: 'RiUserFill' }],
      updated: [
        {
          path: 'Ship.md',
          icon: 'RiSpaceShipFill',
          detail: 'icon LiShip → RiSpaceShipFill',
        },
      ],
      removedWithoutFrontmatter: [{ path: 'Old.md', icon: 'LiFile' }],
      removedMissingPath: [{ path: 'Moved', icon: 'LiFolder' }],
      removedInvalid: [{ path: 'Empty' }],
      invalidFrontmatter: [{ path: 'Bad.md', detail: '`icon` is not text' }],
      missingIconPacks: [
        { icon: 'IbTrayStacked', usedBy: ['GM', 'Archive'], shown: true },
      ],
      missingIcons: [{ icon: 'RiUnknown', usedBy: ['NPC.md'], shown: false }],
      notIndexed: ['New.md'],
      errors: [{ path: 'Broken.md', detail: 'Error: broken' }],
    });

    expect(sections).toEqual([
      { title: 'Added from the frontmatter', items: ['NPC.md (RiUserFill)'] },
      {
        title: 'Updated from the frontmatter',
        items: ['Ship.md (RiSpaceShipFill) – icon LiShip → RiSpaceShipFill'],
      },
      {
        title: 'Removed: notes without an icon in the frontmatter',
        items: ['Old.md (LiFile)'],
      },
      {
        title: 'Removed: files and folders that no longer exist',
        items: ['Moved (LiFolder)'],
      },
      { title: 'Removed: invalid entries', items: ['Empty'] },
      {
        title: 'Not changed: invalid frontmatter',
        items: ['Bad.md – `icon` is not text'],
      },
      {
        title: 'Icon pack not installed',
        items: [
          'IbTrayStacked – still shown from the stored SVG – used by: GM, Archive',
        ],
      },
      {
        title: 'Icon not found in its icon pack',
        items: ['RiUnknown – not shown – used by: NPC.md'],
      },
      {
        title: 'Skipped: notes Obsidian has not indexed yet',
        items: ['New.md'],
      },
      { title: 'Errors', items: ['Broken.md – Error: broken'] },
    ]);
  });
});
