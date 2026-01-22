declare module "cli-box-picker" {
  export type PickBoxChoice =
    | string
    | { value: string; label?: string; description?: string };

  export type PickBoxChoices = Record<string, PickBoxChoice> | PickBoxChoice[];

  export type PickBoxOptions = {
    question: string;
    choices: PickBoxChoices;
    defaultIndex?: number;
    borderStyle?: "round" | "single" | "double";
    selectedColor?: string | ((input: string) => string);
    confirm?: boolean;
    descriptionPlacement?: "inline" | "footer";
    descriptionDisplay?: "selected" | "always" | "none";
    showFooterHint?: boolean;
    boxWidth?: number | null;
  };

  export type PickBoxResult = {
    index: number;
    value: string;
  };

  export type MultiPickBoxResult = {
    indices: number[];
    values: string[];
  };

  export function pickBox(options: PickBoxOptions): Promise<PickBoxResult>;
  export function multiPickBox(options: PickBoxOptions): Promise<MultiPickBoxResult>;
}
