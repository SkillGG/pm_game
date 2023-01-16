import { timeToMs } from "./utils";

export type GamemodeCategory = {
  name: string;
  id: number;
};
export type Gamemode = {
  categories: GamemodeCategory[];
  id: number;
  gametime: number;
};

const CategoryList: GamemodeCategory[] = [
  { name: "Country", id: 1 },
  { name: "City", id: 2 },
  { name: "Name", id: 3 },
  { name: "Plants", id: 4 },
  { name: "Animals", id: 5 },
  { name: "Thing", id: 6 },
];

const category = (id: number) => {
  return CategoryList.find((c) => c.id == id);
};

export const GameModeList: Gamemode[] = [
  {
    categories: [
      category(1),
      category(2),
      category(3),
      category(4),
      category(5),
      category(6),
    ].filter<GamemodeCategory>((f): f is GamemodeCategory => !!f),
    id: 0,
    gametime: timeToMs(0, 0, 3, 0),
  },
];
