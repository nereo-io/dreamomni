import { Brand, Social, Nav, Agreement } from "@/types/blocks/base";

export interface ContactItem {
  title?: string;
  value?: string;
  icon?: string;
  url?: string;
  target?: string;
}

export interface Contact {
  title?: string;
  items?: ContactItem[];
}

export interface Footer {
  disabled?: boolean;
  name?: string;
  brand?: Brand;
  nav?: Nav;
  copyright?: string;
  social?: Social;
  agreement?: Agreement;
  contact?: Contact;
}
