import { beforeEach, describe, expect, it } from 'vitest';
import { addStoredIcons, collectIconSvgs } from './icon-svg-store';

const createIcon = (prefix: string, name: string, svgElement: string): any => ({
  name,
  prefix,
  svgElement,
});

const createPlugin = ({
  usedIcons = [],
  packIcons = [],
  preloadedIcons = [],
  nativeLucide = true,
}: {
  usedIcons?: string[];
  packIcons?: any[];
  preloadedIcons?: any[];
  nativeLucide?: boolean;
} = {}): any => ({
  getUsedIcons: () => new Set(usedIcons),
  doesUseNativeLucideIconPack: () => nativeLucide,
  getIconPackManager: () => ({
    getPreloadedIcons: () => preloadedIcons,
    getIconPacks: () => [{ getIcons: () => packIcons }],
  }),
});

describe('collectIconSvgs', () => {
  let plugin: any;

  describe('when a used icon is available locally', () => {
    beforeEach(() => {
      plugin = createPlugin({
        usedIcons: ['LaCalendar'],
        packIcons: [createIcon('La', 'Calendar', '<svg>local</svg>')],
      });
    });

    it('returns its SVG', () => {
      expect(collectIconSvgs(plugin, {})).toEqual({
        LaCalendar: '<svg>local</svg>',
      });
    });

    it('prefers it over the stored SVG', () => {
      expect(
        collectIconSvgs(plugin, { LaCalendar: '<svg>stored</svg>' }),
      ).toEqual({ LaCalendar: '<svg>local</svg>' });
    });
  });

  describe('when a used icon is only stored', () => {
    beforeEach(() => {
      plugin = createPlugin({ usedIcons: ['LaCalendar'] });
    });

    it('keeps the stored SVG', () => {
      expect(
        collectIconSvgs(plugin, { LaCalendar: '<svg>stored</svg>' }),
      ).toEqual({ LaCalendar: '<svg>stored</svg>' });
    });
  });

  describe('when a used icon has no SVG anywhere', () => {
    beforeEach(() => {
      plugin = createPlugin({ usedIcons: ['LaCalendar'] });
    });

    it('leaves it out', () => {
      expect(collectIconSvgs(plugin, {})).toEqual({});
    });
  });

  describe('when a stored icon is no longer used', () => {
    beforeEach(() => {
      plugin = createPlugin();
    });

    it('drops it', () => {
      expect(
        collectIconSvgs(plugin, { LaCalendar: '<svg>stored</svg>' }),
      ).toEqual({});
    });
  });

  describe('when a used icon is a native Lucide icon', () => {
    beforeEach(() => {
      plugin = createPlugin({
        usedIcons: ['LiHouse'],
        packIcons: [createIcon('Li', 'House', '<svg>house</svg>')],
      });
    });

    it('leaves it out', () => {
      expect(collectIconSvgs(plugin, {})).toEqual({});
    });
  });

  describe('when a used icon is from a custom Lucide pack', () => {
    beforeEach(() => {
      plugin = createPlugin({
        usedIcons: ['LiHouse'],
        packIcons: [createIcon('Li', 'House', '<svg>house</svg>')],
        nativeLucide: false,
      });
    });

    it('returns its SVG', () => {
      expect(collectIconSvgs(plugin, {})).toEqual({
        LiHouse: '<svg>house</svg>',
      });
    });
  });
});

describe('addStoredIcons', () => {
  let preloadedIcons: any[];
  let plugin: any;

  describe('when a stored icon is missing locally', () => {
    beforeEach(() => {
      preloadedIcons = [];
      plugin = createPlugin({ preloadedIcons });
    });

    it('makes it renderable', () => {
      addStoredIcons(plugin, { LaCalendarMonday: '<svg>stored</svg>' });

      expect(preloadedIcons).toEqual([
        expect.objectContaining({
          prefix: 'La',
          name: 'CalendarMonday',
          svgElement: '<svg>stored</svg>',
        }),
      ]);
    });

    it('returns its name', () => {
      expect(
        addStoredIcons(plugin, { LaCalendarMonday: '<svg>stored</svg>' }),
      ).toEqual(['LaCalendarMonday']);
    });
  });

  describe('when a stored icon is available locally', () => {
    beforeEach(() => {
      preloadedIcons = [];
      plugin = createPlugin({
        preloadedIcons,
        packIcons: [createIcon('La', 'Calendar', '<svg>local</svg>')],
      });
    });

    it('keeps the local icon', () => {
      addStoredIcons(plugin, { LaCalendar: '<svg>stored</svg>' });

      expect(preloadedIcons).toEqual([]);
    });

    it('returns nothing', () => {
      expect(
        addStoredIcons(plugin, { LaCalendar: '<svg>stored</svg>' }),
      ).toEqual([]);
    });
  });

  describe('when a stored icon was already added', () => {
    beforeEach(() => {
      preloadedIcons = [createIcon('La', 'Calendar', '<svg>stored</svg>')];
      plugin = createPlugin({ preloadedIcons });
    });

    it('does not add it again', () => {
      addStoredIcons(plugin, { LaCalendar: '<svg>stored</svg>' });

      expect(preloadedIcons).toHaveLength(1);
    });
  });
});
