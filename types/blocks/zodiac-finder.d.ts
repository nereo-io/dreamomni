export interface ZodiacFinderSection {
  title: string;
  instruction: string;
  signs: Array<{
    name: string;
    years: string;
    shortDescription: string;
  }>;
}
