import { RoomJSONData } from "./room";

export type getRoomListOutput = RoomJSONData[];
export type RouteResponse = getRoomListOutput;

export type sendRoomDisconnect = { playerid: string };
export type postRoomDisconnect = string;

export type sendChatWithRoom = { playerid: string; msg: string };
export type postChatWithRoom = string;

export type sendGameStartToRoom = { playerid: string };
export type postGameStartToRoom = string;
