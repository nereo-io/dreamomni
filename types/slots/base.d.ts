import { Crumb, Toolbar, Tip } from "@/types/blocks/base";

export interface Slot {
  title?: string;
  description?: string;
  rules_title?: string;
  rules?: string;
  tip?: Tip;
  crumb?: Crumb;
  toolbar?: Toolbar;
  loading?: boolean;
  data?: any;
  passby?: any;
}
