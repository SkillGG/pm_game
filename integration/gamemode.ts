import { timeToMs } from "./utils";

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
const azExcept = (az: string, s: string[]) =>
    split(az).filter((l) => !s.includes(l));

const CategoryList_en: GamemodeCategory[] = [
    {
        name: "Country",
        id: 1,
        startingLetters: azExcept(aToZ_en, split("wx")),
    },
    { name: "City", id: 2, startingLetters: aToZ_en_split },
    { name: "Name", id: 3, startingLetters: aToZ_en_split },
    { name: "Plant", id: 4, startingLetters: aToZ_en_split },
    { name: "Animal", id: 5, startingLetters: aToZ_en_split },
    { name: "Thing", id: 6, startingLetters: aToZ_en_split },
    { name: "Noun", id: 7, startingLetters: aToZ_en_split },
    { name: "Verb", id: 8, startingLetters: aToZ_en_split },
    { name: "Adverb", id: 9, startingLetters: aToZ_en_split },
    { name: "Adjective", id: 10, startingLetters: aToZ_en_split },
    { name: "Rivers", id: 11, startingLetters: aToZ_en_split },
    { name: "Food", id: 12, startingLetters: aToZ_en_split },
    { name: "Song Title", id: 13, startingLetters: aToZ_en_split },
    { name: "Movie Title", id: 14, startingLetters: aToZ_en_split },
];

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
        pointsForRepeats: [10,5]
    },
];
