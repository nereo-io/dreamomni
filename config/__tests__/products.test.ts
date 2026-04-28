/// <reference types="jest" />

import {
  BUNDLE_BONUS_BY_PRODUCT_ID,
  BUNDLE_CONFIGS,
  canUpgradeToTier,
  getBundleBonusCreditsForTier,
  SUBSCRIPTION_TIER_RANK,
} from '../products';

describe('subscription product ranking', () => {
  it('orders monthly and yearly plans by tier progression', () => {
    expect(Object.keys(SUBSCRIPTION_TIER_RANK)).toEqual([
      'mini-monthly',
      'mini-yearly',
      'standard-monthly',
      'standard-yearly',
      'plus-monthly',
      'plus-yearly',
      'max-monthly',
      'max-yearly',
    ]);
  });

  it('does not treat every yearly plan as higher than every monthly plan', () => {
    expect(canUpgradeToTier('mini-yearly', 'standard-monthly')).toBe(true);
    expect(canUpgradeToTier('standard-yearly', 'plus-monthly')).toBe(true);
    expect(canUpgradeToTier('plus-yearly', 'max-monthly')).toBe(true);

    expect(canUpgradeToTier('standard-monthly', 'mini-yearly')).toBe(false);
    expect(canUpgradeToTier('plus-monthly', 'standard-yearly')).toBe(false);
    expect(canUpgradeToTier('max-monthly', 'plus-yearly')).toBe(false);
  });
});

describe('bundle product pricing', () => {
  it('exposes the active one-time credit bundles', () => {
    expect(BUNDLE_CONFIGS.map((config) => config.product_id)).toEqual([
      'bundle-20',
      'bundle-40',
      'bundle-100',
      'bundle-200',
      'bundle-500',
      'bundle-1000',
    ]);
    expect(
      BUNDLE_CONFIGS.find((config) => config.product_id === 'bundle-60'),
    ).toBeUndefined();
  });

  it('uses the configured bonus credits by subscription tier', () => {
    expect(getBundleBonusCreditsForTier('bundle-20', 'plus')).toBe(200);
    expect(getBundleBonusCreditsForTier('bundle-20', 'max')).toBe(200);

    expect(getBundleBonusCreditsForTier('bundle-40', 'standard')).toBe(100);
    expect(getBundleBonusCreditsForTier('bundle-40', 'plus')).toBe(300);
    expect(getBundleBonusCreditsForTier('bundle-40', 'max')).toBe(300);

    expect(getBundleBonusCreditsForTier('bundle-100', 'standard')).toBe(300);
    expect(getBundleBonusCreditsForTier('bundle-100', 'plus')).toBe(1000);
    expect(getBundleBonusCreditsForTier('bundle-100', 'max')).toBe(1000);

    expect(getBundleBonusCreditsForTier('bundle-200', 'standard')).toBe(600);
    expect(getBundleBonusCreditsForTier('bundle-200', 'plus')).toBe(2000);
    expect(getBundleBonusCreditsForTier('bundle-200', 'max')).toBe(2000);

    expect(getBundleBonusCreditsForTier('bundle-500', 'standard')).toBe(1600);
    expect(getBundleBonusCreditsForTier('bundle-500', 'plus')).toBe(5000);
    expect(getBundleBonusCreditsForTier('bundle-500', 'max')).toBe(5000);

    expect(getBundleBonusCreditsForTier('bundle-1000', 'standard')).toBe(3300);
    expect(getBundleBonusCreditsForTier('bundle-1000', 'plus')).toBe(20000);
    expect(getBundleBonusCreditsForTier('bundle-1000', 'max')).toBe(20000);
  });

  it('keeps bundle bonus entries aligned with active bundle configs', () => {
    expect(Object.keys(BUNDLE_BONUS_BY_PRODUCT_ID)).toEqual(
      BUNDLE_CONFIGS.map((config) => config.product_id),
    );
  });
});
