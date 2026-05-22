import { readFileSync } from 'fs';
import path from 'path';

const pricingFiles = [
  'components/blocks/pricing/enhanced-pricing.tsx',
  'components/blocks/pricing/pricing-modal.tsx',
];

describe('pricing subscription button copy', () => {
  test.each(pricingFiles)(
    '%s names the target plan for upgrades and softens downgrade copy',
    (filePath) => {
      const source = readFileSync(
        path.join(process.cwd(), filePath),
        'utf8',
      );

      expect(source).toContain('Upgrade to ${item.title}');
      expect(source).toContain('Subscription to ${item.title}');
      expect(source).not.toContain('Downgrade Not Allowed');
      expect(source).not.toContain('Downgrade is not allowed');
    },
  );
});
