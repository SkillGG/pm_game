import { EventEmitter } from "events";
import { ExcludeSubType } from "./utils";
import { Gamemode, GameModeList } from "./gamemode";
import { HostChangeEvent, JoinEvent, RoomEventData, StartEvent } from "./roomevents";

export type RoomJSONData = ExcludeSubType<Room, Function>;

export enum RoomState {
  WAITING = 0,
  PLAY = 1,
}

export class Room {
  gamemode: Gamemode;
  playerEmitters: Map<string, EventEmitter>;
  maxNumberOfPlayers: number = 4;
  connected: string[] = [];
  host: string = "";
  id: number = Room._ID + 1;
  state: RoomState = RoomState.WAITING;
  private static _ID = 0;
  constructor(gamemodeID: number = -1) {
    this.playerEmitters = new Map();
    this.gamemode =
      GameModeList.find((g) => g.id == gamemodeID) || GameModeList[0];
    Room._ID++;
  }
  startGame() {
    this.state = RoomState.PLAY;
    const endTime = new Date().getTime() + this.gamemode.gametime;
    this.emitEvent({
      type: "gamestart",
      playerSending: this.host,
      payload: new Date(endTime).toString(),
    } as StartEvent);
  }
  emitEvent(data: RoomEventData) {
    console.log("Emmitting event to all players", data);
    if (data.type === "leave") {
      this.disconnectPlayer(data.playerSending);
    } else if (data.type === "join") {
      this.connectPlayer(data.playerSending);
    }
    [...this.playerEmitters].forEach((e) => e[1].emit("SSE", data));
  }
  connectPlayer(id: string) {
    if (this.connected.length < this.maxNumberOfPlayers) {
      this.connected.push(id);
      this.connected = [...new Set(this.connected)];
      if (!this.host) {
        this.host = id;
        this.emitEvent({
          type: "hostchange",
          payload: id,
          playerSending: "server",
        } as HostChangeEvent);
      }
    }
  }
  createPlayerEmitter(id: string) {
    this.playerEmitters.set(id, new EventEmitter());
  }
  disconnectPlayer(id: string) {
    if (this.connected.includes(id)) {
      this.connected = this.connected.filter((p) => p !== id);
      this.playerEmitters = new Map(
        [...this.playerEmitters].filter((f) => f[0] !== id)
      );
      this.host = this.connected[0];
      if (this.connected.length <= 0) {
        this.host = "";
      }
      this.emitEvent({
        type: "hostchange",
        playerSending: "server",
        payload: this.host,
      } as HostChangeEvent);
    }
  }
}
