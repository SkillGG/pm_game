import { Hub } from "./hub";
import { FRequest, FResponse, Route, SSERoute, startServer } from "./server";
import {
    getRoomListOutput,
    sendChatWithRoom,
    sendGameStartToRoom,
    sendGatherToRoom,
    sendHasteToRoom,
    sendRoomDisconnect,
} from "./../integration/routebacks";
import { EventEmitter, on } from "events";
import { Room } from "../integration/room";
import {
    ChatEvent,
    JoinEvent,
    LeaveEvent,
    RoomEventData,
} from "../integration/roomevents";
import { FastifyRequest } from "fastify";

export interface RoomIDParams {
    roomid: string;
}

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
            timer: null,
        }));
        res.send(JSON.stringify(roomList));
    }

    useRoomEmitterRoute<T, X extends RoomIDParams = RoomIDParams>(
        req: FRequest<X>,
        res: FResponse,
        sse: boolean = false,
        err: (err: Error) => void = (err) => console.error(err)
    ) {
        const { params } = req as { params: X };
        if (!params.roomid) throw "No roomid";
        const rid = parseInt(params.roomid);
        try {
            if (!rid) throw new Error("Invalid request");
            const data: T | null = !sse ? JSON.parse(req.body) : null;
            const room = Hub.getRoom(rid);
            if (!room) throw new Error("Room doesn't exist!");
            return { room, data, params };
        } catch (e) {
            err(e as Error);
            return null;
        }
    }

    // #region /room/#

    @Route("post")
    $room$_roomid_$start(req: FRequest<{ roomid: string }>, res: FResponse) {
        const route = this.useRoomEmitterRoute<sendGameStartToRoom>(req, res);
        if (!route) return res.status(403).send("Could not get room data");
        const { data, room } = route;
        if (data?.playerid == room.host) room.startRound();
        return;
    }

    @Route("post")
    $room$_roomid_$data(req: FRequest<{ roomid: string }>, res: FResponse) {
        const route = this.useRoomEmitterRoute<sendGatherToRoom>(req, res);
        if (!route) return res.status(403).send("Could not get room data");
        const { data, room } = route;
        console.log("Got data from player:", data?.playerid, data?.data);
        if (data?.playerid) room.setPlayerData(data.playerid, data?.data);
        return;
    }

    @Route("post")
    $room$_roomid_$haste(req: FRequest<{ roomid: string }>, res: FResponse) {
        const route = this.useRoomEmitterRoute<sendHasteToRoom>(req, res);
        if (!route) return res.status(403).send("Could not get room data");
        const { data, room } = route;
        console.log("Player", data?.playerid, "send haste!");
        room.doHaste();
        return;
    }

    @Route("post")
    $room$_roomid_$chat(req: FRequest<{ roomid: string }>, res: FResponse) {
        const route = this.useRoomEmitterRoute<sendChatWithRoom>(req, res);
        if (!route) return res.status(403).send("Could not get room data");
        const { data, room } = route;
        if (!data) return res.status(403).send("Data not specified");
        const { playerid, msg } = data;
        if (!msg) return;
        if (!playerid) return;
        room.emitEvent({
            playerSending: playerid,
            payload: msg,
            type: "chatmessage",
        } as ChatEvent);
        return;
    }

    @Route("post")
    $room$_roomid_$disconnect(
        req: FRequest<{ roomid: string }>,
        res: FResponse
    ) {
        const route = this.useRoomEmitterRoute<sendRoomDisconnect>(req, res);
        if (!route) return res.status(403).send("Could not get room data");
        const { data, room } = route;
        if (!data?.playerid) return;
        room.emitEvent({
            playerSending: data.playerid,
            payload: "leave",
            type: "leave",
        } as LeaveEvent);
        return;
    }

    @SSERoute("get")
    $room$_roomid_$connect$_playerid_(
        req: FRequest<{ roomid: string; playerid: string }>,
        res: FResponse
    ) {
        console.log(req.body);
        const route = this.useRoomEmitterRoute(req, res, true);
        if (!route) return res.status(403).send("Could not get room data");
        const { room, params } = route;
        const { playerid } = params;

        if (!playerid) return res.status(403).send();

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
        const emitter = room.playersEmitters.get(playerid);

        if (!emitter)
            return res
                .status(500)
                .send(
                    "There was an error creating event emitter for player with id " +
                        playerid
                );

        res.sse(fx(emitter));

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
        return;
    }
}
