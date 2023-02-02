import { AnswersArray, RoomJSONData } from "./utils";

export type getRoomListOutput = RoomJSONData[];
export type RouteResponse = getRoomListOutput;

export type sendRoomDisconnect = { playerid: string };
export type postRoomDisconnect = string;

export type sendChatWithRoom = { playerid: string; msg: string };
export type postChatWithRoom = string;

export type sendGameStartToRoom = { playerid: string };
export type postGameStartToRoom = string;

export type sendGatherToRoom = {
    playerid: string;
    data: AnswersArray;
};
export type postGatherToRoom = string;

export type sendHasteToRoom = { playerid: string };
export type postHasteToRoom = string;
