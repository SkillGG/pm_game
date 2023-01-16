import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import Server from 'src/server_integration/server';
import * as internal from 'stream';
import { RoomJSONData } from '../../../../integration/room';
import { RoomEventData } from '../../../../integration/roomevents';

type AnswersMap = Map<number, string>;

@Component({
  selector: 'app-game-room',
  templateUrl: './game-room.component.html',
  styleUrls: ['./game-room.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameRoomComponent {
  @Input() roomdata?: RoomJSONData;
  @Input() playerid: string = '';
  eventSource?: EventSource;
  @Output() disconnectFrom: EventEmitter<undefined> = new EventEmitter();
  roomMessages: { from: string; message: string }[] = [];
  message: string = '';
  answers: AnswersMap = new Map();
  roomtimer: NodeJS.Timer | null = null;
  answerLockTime: number = 0;
  constructor(private cd: ChangeDetectorRef) {}
  getTimeUntil() {
    if (!this.answerLockTime) return -1;
    else {
      return new Date(this.answerLockTime - new Date().getTime()).getMinutes();
    }
  }
  playerLeft(playerid: string) {
    if (this.roomdata) {
      this.roomdata = {
        ...this.roomdata,
        connected: this.roomdata.connected.filter((p) => p !== playerid),
      };
      this.cd.detectChanges();
    }
  }
  playerJoined(playerid: string) {
    if (this.roomdata) {
      this.roomdata = {
        ...this.roomdata,
        connected: [...new Set([...this.roomdata.connected, playerid])],
      };
      this.cd.detectChanges();
    }
  }
  sendMessage(msg: string) {
    if (this.roomdata) {
      Server.chatWithRoom(this.roomdata.id, this.playerid, msg);
    }
  }
  submitAnswers() {
    console.log(
      [...this.answers].map(
        (r) =>
          `${
            this.roomdata?.gamemode?.categories?.find((cat) => cat.id == r[0])
              ?.name
          }: ${r[1]}`
      )
    );
  }
  sendStart() {
    if (this.roomdata)
      Server.sendGameStartSignal(this.roomdata.id, this.playerid);
  }
  startGameTimer() {
    if (
      !this.roomdata ||
      !this.roomdata.gamemode ||
      !this.roomdata.gamemode.gametime
    )
      return;
    this.roomtimer = setInterval(() => {
      const now = new Date().getTime();
      if (now - this.answerLockTime < 0) {
        if (this.roomtimer) clearInterval(this.roomtimer);
      }
    }, 1000);
  }
  ngOnInit() {
    if (!this.roomdata || !this.playerid) return;
    if (!this.eventSource) {
      if (this.roomdata.id > 0 && this.playerid) {
        this.eventSource = Server.connectToRoom(
          this.roomdata.id,
          this.playerid
        );
        this.roomdata.connected.push(this.playerid);
        window.history.pushState('/?a=1', '', null);
        this.roomdata.connected = [...new Set(this.roomdata.connected)];
        this.eventSource.onmessage = (ev: MessageEvent<string>) => {
          // on recieved message from server
          if (!this.roomdata) return;
          const event = JSON.parse(ev.data) as RoomEventData;
          console.log('RoomEvent', event);
          switch (event.type) {
            case 'join':
              console.log('player joined!', event.playerSending);
              this.playerJoined(event.playerSending);
              break;
            case 'leave':
              console.log('player left!', event.playerSending);
              this.playerLeft(event.playerSending);
              break;
            case 'chatmessage':
              console.log('player sent a message', event);
              this.roomMessages.push({
                from: event.playerSending,
                message: event.payload,
              });
              break;
            case 'hostchange':
              this.roomdata.host = event.payload;
              console.log('player made host', event.payload);
              break;
            case 'gamestart':
              if (this.roomdata.host == event.playerSending) {
                this.answerLockTime = new Date(event.payload).getTime();
                this.startGameTimer();
              }
              break;
          }
          this.cd.detectChanges();
        };
      }
    }
  }
  ngOnDestroy() {
    if (this.roomdata)
      Server.disconnectFromRoom(this.roomdata.id, this.playerid);
  }
  disconnect() {
    this.disconnectFrom.emit();
  }
}
