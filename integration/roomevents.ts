import { AnswersArray } from "./utils";

export enum EventType {
    CHAT = "chatmessage",
    GAMEDATA = "gamedata",
    GATHER_DATA = "gatherdata",
    HOSTCHANGE = "hostchange",
    JOIN = "join",
    LEAVE = "leave",
    TIMER = "timer",
    TOGGLELOCK = "togglelock",
    UPDATE = "update",
}

export interface EventData {
    playerSending: string;
    type: EventType;
    payload: any;
}

export interface JoinEvent extends EventData {
    type: EventType.JOIN;
    payload: "join";
}

export interface LeaveEvent extends EventData {
    type: EventType.LEAVE;
    payload: "leave";
}

export type GameData = string;

export interface GameDataEvent extends EventData {
    type: EventType.GAMEDATA;
    payload: GameData;
}

export interface ChatEvent extends EventData {
    type: EventType.CHAT;
    payload: string;
}

export interface TimerEvent extends EventData {
    type: EventType.TIMER;
    payload: EventTimerOptions | null;
    playerSending: "server";
}

export enum TimerType {
    DRAW_LETTER = "drawletter",
    PRIMARY_GUESSING = "primary",
    HASTE_GUESSING = "haste",
}

export interface EventTimerOptions {
    endTime: number;
    timerType: TimerType;
}

export interface LockEvent extends EventData {
    type: EventType.TOGGLELOCK;
    payload: boolean;
    playerSending: "server";
}

export interface HostChangeEvent extends EventData {
    type: EventType.HOSTCHANGE;
    payload: string;
    playerSending: "server";
}

export interface GatherDataEvent extends EventData {
    type: EventType.GATHER_DATA;
    payload: string;
    playerSending: "server";
}

export interface UpdateEvent extends EventData {
    type: EventType.UPDATE;
    payload: UpdateData;
    playerSending: "server";
}

export enum UpdateDataType {
    LETTER_DRAWN = "letterdrawn",
    ROUND_END = "roundend",
}

export type LetterDrawnUpdate = {
    type: UpdateDataType.LETTER_DRAWN;
    letter: string;
};

export type RoundEndUpdate = {
    type: UpdateDataType.ROUND_END;
    endRoundData: {
        answers: AnswersArray[];
        points: [string, number, number][];
    };
};

export type UpdateData = LetterDrawnUpdate | RoundEndUpdate;

export type RoomEventData =
    | JoinEvent
    | LeaveEvent
    | GameDataEvent
    | ChatEvent
    | LockEvent
    | UpdateEvent
    | GatherDataEvent
    | HostChangeEvent
    | TimerEvent;
