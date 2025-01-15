import { Button } from "@/types/blocks/base";

type ValidationRule = {
  required?: boolean;
  min?: number;
  max?: number;
  message?: string;
  email?: boolean;
};

export interface FormField {
  name?: string;
  title?: string;
  type?: "text" | "textarea" | "number" | "email" | "password" | "select";
  placeholder?: string;
  value?: string;
  tip?: string;
  attributes?: Record<string, any>;
  validation?: ValidationRule;
}

export interface FormSubmit {
  button?: Button;
  handler?: (data: any) => any;
}

export interface Form {
  fields: FormField[];
  data?: any;
  submit?: FormSubmit;
}
