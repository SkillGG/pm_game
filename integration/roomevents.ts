export enum EventType {
  JOIN = "join",
  LEAVE = "leave",
  GAMEDATA = "gamedata",
  CHAT = "chatmessage",
  START = "gamestart",
  HOSTCHANGE = "hostchange",
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

export interface StartEvent extends EventData {
  type: EventType.START;
  payload: number;
}

export interface HostChangeEvent extends EventData {
  type: EventType.HOSTCHANGE;
  payload: string;
  playerSending: "server";
}

export type RoomEventData =
  | JoinEvent
  | LeaveEvent
  | GameDataEvent
  | ChatEvent
  | StartEvent
  | HostChangeEvent;
