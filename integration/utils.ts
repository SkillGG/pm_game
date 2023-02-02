import { inspect } from "util";
import { Room } from "./room";

export type ExcludeSubType<Base, Condition> = Pick<
    Base,
    {
        [Key in keyof Base]: Base[Key] extends Condition ? never : Key;
    }[keyof Base]
>;

export type AnswersMap = Map<number, string>;
export type AnswersArray = [number, string][];

export const timeToMs = (
    ms: number = 0,
    s: number = 0,
    m: number = 0,
    h: number = 0
) => ms + s * 1000 + m * 1000 * 60 + h * 1000 * 60 * 60;

export type RoomJSONData = ExcludeSubType<Room, Function>;

export type PlayerPointsForCategory = {
    categoryId: number;
    points: number;
};

export enum RoomState {
    WAITING = 0,
    PLAY = 1,
}

export type GameStateData = {
    startingLetter?: string;
    regulationEndTime?: number;
};

export const varDump = (obj: any) => {
    console.log(
        inspect(obj, {
            colors: true,
            depth: null,
            showHidden: true,
            compact: false,
        })
    );
};
