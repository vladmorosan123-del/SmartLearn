const ALL = ['A', 'B', 'C', 'D', 'E', 'F'] as const;

export const optionsUpTo = (maxLetter: string | undefined | null): string[] => {
  const idx = ALL.indexOf((maxLetter || 'D') as any);
  return ALL.slice(0, idx === -1 ? 4 : idx + 1);
};

export const ALL_LETTERS = ALL;
