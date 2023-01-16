export type ExcludeSubType<Base, Condition> = Pick<
  Base,
  {
    [Key in keyof Base]: Base[Key] extends Condition ? never : Key;
  }[keyof Base]
>;

export const timeToMs = (
  ms: number = 0,
  s: number = 0,
  m: number = 0,
  h: number = 0
) => ms + s * 1000 + m * 1000 * 60 + h * 1000 * 60 * 60;
