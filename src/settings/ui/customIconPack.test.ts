import { beforeAll, describe, expect, it, vi } from 'vitest';
import CustomIconPackSetting from './customIconPack';
import IconizePlugin from '@app/main';
import { IconPackLoadState } from '@app/icon-pack-manager';
import { EventEmitter } from '@app/lib/event/event';

vi.mock('obsidian', () => {
  const createControl = () => ({
    buttonEl: document.createElement('button'),
    setPlaceholder: vi.fn(),
    setButtonText: vi.fn(),
    setIcon: vi.fn(),
    setTooltip: vi.fn(),
    onClick: vi.fn(),
    getValue: vi.fn(() => ''),
    setValue: vi.fn(),
    addOptions: vi.fn(),
    onChange: vi.fn(),
  });

  class Setting {
    settingEl = document.createElement('div');
    nameEl = document.createElement('div');
    descEl = document.createElement('div');

    constructor(containerEl: HTMLElement) {
      this.settingEl.append(this.nameEl, this.descEl);
      containerEl.appendChild(this.settingEl);
    }

    setName(name: string) {
      this.nameEl.textContent = name;
      return this;
    }

    setDesc(desc: string) {
      this.descEl.textContent = desc;
      return this;
    }

    addText(cb: (control: ReturnType<typeof createControl>) => void) {
      cb(createControl());
      return this;
    }

    addButton(cb: (control: ReturnType<typeof createControl>) => void) {
      cb(createControl());
      return this;
    }

    addDropdown(cb: (control: ReturnType<typeof createControl>) => void) {
      cb(createControl());
      return this;
    }
  }

  return { Notice: vi.fn(), Setting };
});

const ADD_ICON_PACK = 'Add a custom icon pack.';
const NATIVE_LUCIDE =
  'Total icons: 1500 (Native Pack has fewer icons but 100% Obsidian Sync support)';
const LOADING = 'Total icons: loading...';
const FAILED = 'Could not be loaded.';

const makeIconPack = (name: string, prefix: string, amountOfIcons: number) => {
  let icons = new Array(amountOfIcons).fill({});
  return {
    getName: () => name,
    getPrefix: () => prefix,
    getIcons: () => icons,
    setAmountOfIcons: (amount: number) => {
      icons = new Array(amount).fill({});
    },
  };
};

const makePlugin = (
  iconPacks: ReturnType<typeof makeIconPack>[],
  loadStates: Record<string, IconPackLoadState> = {},
) => {
  const eventEmitter = new EventEmitter();
  let loadedAll = false;
  const iconPackManager = {
    getIconPacks: () => iconPacks,
    getIconPackLoadState: (name: string) =>
      loadStates[name] ?? (loadedAll ? 'loaded' : 'loading'),
  };
  const plugin = {
    getIconPackManager: () => iconPackManager,
    getEventEmitter: () => eventEmitter,
    doesUseNativeLucideIconPack: () => true,
    getSettings: () => ({ lucideIconPackType: 'native' }),
  } as unknown as IconizePlugin;

  return {
    plugin,
    eventEmitter,
    /** Does what the icon pack manager does after reading an icon pack. */
    finishIconPack: (iconPackName: string, success = true) => {
      loadStates[iconPackName] = success ? 'loaded' : 'failed';
      eventEmitter.emit('iconPackLoaded', { iconPackName, success });
    },
    finishAllIconPacks: () => {
      loadedAll = true;
      eventEmitter.emit('allIconsLoaded');
    },
  };
};

const getDescriptions = (containerEl: HTMLElement) =>
  Array.from(containerEl.children).map(
    (settingEl) => settingEl.children[1].textContent,
  );

describe('CustomIconPackSetting', () => {
  beforeAll(() => {
    // Obsidian adds this helper to all elements.
    HTMLElement.prototype.addClass = function (...classes: string[]) {
      this.classList.add(...classes);
    };
  });

  it('should update each icon pack as soon as it was read after the settings were opened', () => {
    const remixIcons = makeIconPack('remix-icons', 'Ri', 0);
    const tablerIcons = makeIconPack('tabler-icons', 'Ti', 0);
    const lucideIcons = makeIconPack('lucide-icons', 'Li', 1500);
    const { plugin, finishIconPack } = makePlugin([
      tablerIcons,
      remixIcons,
      lucideIcons,
    ]);
    const containerEl = document.createElement('div');

    new CustomIconPackSetting(plugin, containerEl, vi.fn()).display();

    expect(getDescriptions(containerEl)).toEqual([
      ADD_ICON_PACK,
      NATIVE_LUCIDE,
      LOADING,
      LOADING,
    ]);

    remixIcons.setAmountOfIcons(3229);
    finishIconPack('remix-icons');

    expect(getDescriptions(containerEl)).toEqual([
      ADD_ICON_PACK,
      NATIVE_LUCIDE,
      'Total icons: 3229',
      LOADING,
    ]);

    finishIconPack('tabler-icons', false);

    expect(getDescriptions(containerEl)).toEqual([
      ADD_ICON_PACK,
      NATIVE_LUCIDE,
      'Total icons: 3229',
      FAILED,
    ]);
  });

  it('should show the state of icon packs that were already read without listening for events', () => {
    const { plugin, eventEmitter } = makePlugin(
      [
        makeIconPack('remix-icons', 'Ri', 3229),
        makeIconPack('tabler-icons', 'Ti', 0),
      ],
      { 'remix-icons': 'loaded', 'tabler-icons': 'failed' },
    );
    const on = vi.spyOn(eventEmitter, 'on');
    const containerEl = document.createElement('div');

    new CustomIconPackSetting(plugin, containerEl, vi.fn()).display();

    expect(getDescriptions(containerEl)).toEqual([
      ADD_ICON_PACK,
      'Total icons: 3229',
      FAILED,
    ]);
    expect(on).not.toHaveBeenCalled();
  });

  it('should update icon packs without their own event once all icon packs were read', () => {
    const newIcons = makeIconPack('new-icons', 'Ni', 0);
    const { plugin, finishAllIconPacks } = makePlugin([newIcons]);
    const containerEl = document.createElement('div');

    new CustomIconPackSetting(plugin, containerEl, vi.fn()).display();
    expect(getDescriptions(containerEl)).toEqual([ADD_ICON_PACK, LOADING]);

    finishAllIconPacks();

    expect(getDescriptions(containerEl)).toEqual([
      ADD_ICON_PACK,
      'Total icons: 0',
    ]);
  });

  it('should stop updating the icon packs when the settings are closed', () => {
    const remixIcons = makeIconPack('remix-icons', 'Ri', 3229);
    const { plugin, eventEmitter, finishIconPack, finishAllIconPacks } =
      makePlugin([remixIcons]);
    const off = vi.spyOn(eventEmitter, 'off');
    const containerEl = document.createElement('div');
    const setting = new CustomIconPackSetting(plugin, containerEl, vi.fn());

    setting.display();
    setting.hide();
    finishIconPack('remix-icons');
    finishAllIconPacks();

    expect(getDescriptions(containerEl)).toEqual([ADD_ICON_PACK, LOADING]);
    expect(off).toHaveBeenCalledWith('iconPackLoaded', expect.any(Function));
    expect(off).toHaveBeenCalledWith('allIconsLoaded', expect.any(Function));
  });
});
