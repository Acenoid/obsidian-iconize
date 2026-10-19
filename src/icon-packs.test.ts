import { describe, it, expect } from 'vitest';
import { getExtraPath, isInExtraPath } from './icon-packs';

it('should return the correct extra path for an icon pack', () => {
  const iconPackName = 'simple-icons';
  const expectedPath = 'simple-icons-16.15.0/icons/';

  const path = getExtraPath(iconPackName);

  expect(path).toEqual(expectedPath);
});

it('should return `undefined` for an icon pack that does not exist', () => {
  const iconPackName = 'non-existent-icon-pack';

  const path = getExtraPath(iconPackName);

  expect(path).toBeUndefined();
});

describe('isInExtraPath', () => {
  const extraPath = 'fontawesome-free-7.2.0-web/svgs/regular/';

  it('should return `true` for a file in the extra path', () => {
    expect(
      isInExtraPath(
        'fontawesome-free-7.2.0-web/svgs/regular/address-card.svg',
        extraPath,
      ),
    ).toBe(true);
  });

  it('should return `true` for a file from a zip file of an older version', () => {
    expect(
      isInExtraPath(
        'fontawesome-free-6.5.1-web/svgs/regular/address-card.svg',
        extraPath,
      ),
    ).toBe(true);
  });

  it('should return `false` for a file in another directory of the zip file', () => {
    expect(
      isInExtraPath(
        'fontawesome-free-6.5.1-web/svgs/solid/address-card.svg',
        extraPath,
      ),
    ).toBe(false);
    expect(isInExtraPath('address-card.svg', extraPath)).toBe(false);
  });

  it('should not ignore the directory of an extra path with only one directory', () => {
    expect(isInExtraPath('svg/arrow.svg', 'svg')).toBe(true);
    expect(isInExtraPath('other/svg/arrow.svg', 'svg')).toBe(false);
  });
});
