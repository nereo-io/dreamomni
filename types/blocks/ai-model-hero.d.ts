export interface AIModel {
  id: string;
  name: string;
  logo: string;
}

export interface AIModelsHero {
  title: string;
  description: string;
  models: AIModel[];
  moreModels: string;
}
