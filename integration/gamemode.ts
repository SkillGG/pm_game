import { timeToMs } from "./utils";

import catFile from "./categories.json";

export type GamemodeCategory = {
    name: string;
    id: number;
    startingLetters: string[];
};
export type Gamemode = {
    categories: GamemodeCategory[];
    id: number;
    startingLetters: string[];
    gametime: number;
    hastetime?: number | null;
    drawlettertime?: number;
    pointsForRepeats: number[];
};

const split = (s: string) => s.split("");
const aToZ_en = "abcdefghijklmopqrstuvwxyz";
const aToZ_en_split = split(aToZ_en);
const azExcept = (az: string, s: string | string[]): string[] =>
    split(az).filter((l) => !s.includes(l));

const CategoryNames: Pick<GamemodeCategory, "id" | "name">[] = catFile;

const CustomCategoryStartingLetters: {
    id: number;
    startingLetters: string[];
}[] = [{ startingLetters: azExcept(aToZ_en, "wx"), id: 1 }];

const CategoryList_en: GamemodeCategory[] = CategoryNames.map((cat) => {
    return {
        ...cat,
        startingLetters:
            CustomCategoryStartingLetters.find((c) => c.id === cat.id)
                ?.startingLetters || aToZ_en_split,
    };
});

const category = (id: number) => {
    return CategoryList_en.find((c) => c.id == id);
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
        startingLetters: aToZ_en_split,
        gametime: timeToMs(0, 30),
        hastetime: timeToMs(0, 3),
        drawlettertime: timeToMs(0, 2),
        pointsForRepeats: [10, 5],
    },
];
