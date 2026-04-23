export interface DesignTokenSet {
  readonly colorScheme: "light" | "dark";
  readonly spacingUnit: number;
}

export const baseDesignTokens: DesignTokenSet = {
  colorScheme: "dark",
  spacingUnit: 4,
};
