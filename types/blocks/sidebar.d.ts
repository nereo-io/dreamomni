import { Brand, Nav, Social } from "@/types/blocks/base";

export interface Sidebar {
  disabled?: boolean;
  brand?: Brand;
  nav?: Nav;
  buttons?: Button[];
  library?: ReactNode;
  social?: Social;
}
