import { Hub } from "./hub";
import { FRequest, FResponse, Route, SSERoute, startServer } from "./server";
import {
  getRoomListOutput,
  sendChatWithRoom,
  sendGameStartToRoom,
  sendRoomDisconnect,
} from "./../integration/routebacks";
import { EventEmitter, on } from "events";
import { Room } from "../integration/room";
import {
  ChatEvent,
  JoinEvent,
  LeaveEvent,
  RoomEventData,
  StartEvent,
} from "../integration/roomevents";

export class Routing {
  constructor(port: number) {
    startServer(port);
  }

  @Route("get")
  $getRoomList(req: FRequest<{}>, res: FResponse) {
    res.header("Content-Type", "text/json");
    console.log(Hub.rooms);
    const roomList: getRoomListOutput = Hub.rooms.map((r) => ({
      ...r,
    }));
    res.send(JSON.stringify(roomList));
  }

  useRoomEmitterRoute<T>(
    req: FRequest<{ roomid: string }>,
    res: FResponse,
    cb: (room: Room, data: T) => void,
    err: (err: Error) => void = (err) => res.status(400).send(err.message)
  ) {
    const { roomid } = req.params;
    const rid = parseInt(roomid);
    try {
      if (!rid) throw new Error("Invalid request");
      const data: T = JSON.parse(req.body);
      const room = Hub.getRoom(rid);
      if (!room) throw new Error("Room doesn't exist!");
      cb(room, data);
    } catch (e) {
      err(e as Error);
    }
  }

  // #region /room/#

  @Route("post")
  $room$_roomid_$start(req: FRequest<{ roomid: string }>, res: FResponse) {
    this.useRoomEmitterRoute<sendGameStartToRoom>(req, res, (room, data) => {
      const { playerid } = data;
      if (!playerid) return;
      room.emitEvent({
        playerSending: playerid,
        payload: "start",
        type: "gamestart",
      } as StartEvent);
    });
  }

  @Route("post")
  $room$_roomid_$chat(req: FRequest<{ roomid: string }>, res: FResponse) {
    this.useRoomEmitterRoute<sendChatWithRoom>(req, res, (room, data) => {
      const { playerid, msg } = data;
      if (!msg) return;
      if (!playerid) return;
      room.emitEvent({
        playerSending: playerid,
        payload: msg,
        type: "chatmessage",
      } as ChatEvent);
    });
  }

  @Route("post")
  $room$_roomid_$disconnect(req: FRequest<{ roomid: string }>, res: FResponse) {
    this.useRoomEmitterRoute<sendRoomDisconnect>(req, res, (room, data) => {
      if (!data.playerid) return;
      room.emitEvent({
        playerSending: data.playerid,
        payload: "leave",
        type: "leave",
      } as LeaveEvent);
    });
  }

  @SSERoute("get")
  $room$_roomid_$connect$_playerid_(
    req: FRequest<{ roomid: string; playerid: string }>,
    res: FResponse
  ) {
    const { playerid, roomid } = req.params;
    const rid = parseInt(roomid);
    try {
      if (!playerid) throw new Error("Invalid username!");
      if (!rid) throw new Error("Invalid roomID");
      const room = Hub.getRoom(rid);
      if (!room) throw new Error(`Room with roomID: ${rid} doesn't exist`);
      const fx = async function* (emitter: EventEmitter) {
        console.log("SSE");
        for await (const e of on(emitter, "SSE")) {
          console.log("sseEvent", e);
          const event = e as RoomEventData[];
          const yieldData = {
            data: JSON.stringify(event[0]),
          };
          console.log("yielding", yieldData);
          yield yieldData;
        }
      }.bind(this);

      req.socket.on("close", () => {
        console.log("Lost connection with:", playerid);
        room.emitEvent({
          type: "leave",
          playerSending: playerid,
          payload: "leave",
        } as LeaveEvent);
      });

      room.createPlayerEmitter(playerid);
      const emitter = room.playerEmitters.get(playerid);
      if (emitter) res.sse(fx(emitter));
      else {
        res
          .status(500)
          .send(
            "There was an error creating event emitter for player with id " +
              playerid
          );
        return;
      }
      setTimeout(
        () =>
          room.emitEvent({
            type: "join",
            playerSending: playerid,
            payload: "join",
          } as JoinEvent),
        0
      );
      console.log(Hub.rooms);
    } catch (err) {
      res.status(400).send((err as Error).message);
    }
  }
  // #endregion /room/#

  /* @SSERoute("get")
  $sse(req: FRequest<{}>, res: FResponse) {
    const fx = async function* (emitter: EventEmitter) {
      console.log("SSE");
      for await (const e of on(emitter, "SSE")) {
        console.log(e);
        const event = e;
        const yieldData = {
          data: JSON.stringify(event[0]),
        };
        console.log("yielding", yieldData);
        yield yieldData;
      }
    }.bind(this);

    res.sse(fx(outsideClassEmitter));
  } 
  */
}
