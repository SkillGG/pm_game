import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import Server from 'src/server_integration/server';
import {
  EventTimerOptions,
  EventType,
  RoomEventData,
  TimerType,
  UpdateDataType,
} from '../../../../integration/roomevents';
import { AnswersMap, RoomJSONData } from '../../../../integration/utils';

const epochMS = (m: number) => {
  return { min: Math.floor(m / 1000 / 60), sec: Math.floor((m / 1000) % 60) };
};

type HTMLTimerData = {
  time: string;
  type: TimerType;
};

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
  htmlTimer: HTMLTimerData | null = null;
  randomizedLetter: string = '';
  timerTick: number = 0;
  constructor(private cd: ChangeDetectorRef) {}
  getTimeUntilTimerEnd() {
    if (!this.roomdata?.timerState) return -1;
    else {
      const { min, sec } = epochMS(
        this.roomdata.timerState.endTime - new Date().getTime()
      );
      if (min < 0 && sec < 0) return '00:00';
      const seconds = `${sec}`.padStart(2, '0');
      const minutes = `${min}`.padStart(2, '0');
      return `${minutes}:${seconds}`;
    }
  }
  playerLeft(playerid: string) {
    if (this.roomdata) {
      this.roomdata = {
        ...this.roomdata,
        connected: this.roomdata.connected.filter((p) => p !== playerid),
      };
      this.detectChanges();
    }
  }
  playerJoined(playerid: string) {
    if (this.roomdata) {
      this.roomdata = {
        ...this.roomdata,
        connected: [...new Set([...this.roomdata.connected, playerid])],
      };
      this.detectChanges();
    }
  }
  sendMessage(msg: string, chatMsgBox: HTMLInputElement) {
    if (this.roomdata) {
      Server.chatWithRoom(this.roomdata.id, this.playerid, msg);
      chatMsgBox.value = '';
    }
  }
  checkIfAllAnswersAreFilledIn() {
    return !this.roomdata?.gamemode.categories.find(
      (cat) => !this.answers.get(cat.id)
    );
  }
  submitAnswers() {
    if (!this.roomdata) return;
    if (this.roomdata.timerState?.timerType == TimerType.HASTE_GUESSING)
      Server.sendAnswersToServer(this.roomdata.id, this.playerid, this.answers);
    else {
      const answeredFilled = this.checkIfAllAnswersAreFilledIn();
      console.log(
        'answers filled',
        answeredFilled,
        this.answers,
        this.roomdata.gamemode.categories
      );
      if (answeredFilled)
        Server.sendHasteSignalToServer(this.roomdata.id, this.playerid);
    }
  }
  sendStart() {
    if (this.roomdata)
      Server.sendGameStartSignal(this.roomdata.id, this.playerid);
  }
  detectChanges() {
    this.cd.detectChanges();
  }
  startTimer() {
    if (this.roomtimer) clearInterval(this.roomtimer);
    this.roomtimer = setInterval(
      () => {
        console.log('timer', this.roomdata?.timerState?.timerType);
        if (!this.roomdata) return this.stopTimer();
        if (!this.roomdata.timerState) return this.stopTimer();
        const timeUntil = this.getTimeUntilTimerEnd();
        this.htmlTimer =
          timeUntil !== -1
            ? {
                time: timeUntil,
                type: this.roomdata.timerState.timerType,
              }
            : null;
        this.timerTick++;
        this.detectChanges();
      },
      this.roomdata?.timerState?.timerType == TimerType.DRAW_LETTER ? 5 : 200
    );
  }
  stopTimer() {
    if (this.roomtimer) {
      clearInterval(this.roomtimer);
      this.roomtimer = null;
      this.htmlTimer = null;
    } else {
      console.log('No timer to stop!');
    }
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
        this.eventSource.onopen = (_) => {
          if (this.roomdata?.timerState) {
            if (!this.roomdata.playingPlayers.includes(this.playerid))
              this.roomdata.locked = true;
            this.startTimer();
          }
        };
        this.eventSource.onmessage = (ev: MessageEvent<string>) => {
          // on recieved message from server
          if (!this.roomdata) return;
          const event = JSON.parse(ev.data) as RoomEventData;
          console.log('RoomEvent', event);
          switch (event.type) {
            case EventType.JOIN:
              this.playerJoined(event.playerSending);
              break;
            case EventType.LEAVE:
              this.playerLeft(event.playerSending);
              break;
            case EventType.CHAT:
              this.roomMessages.push({
                from: event.playerSending,
                message: event.payload,
              });
              break;
            case EventType.HOSTCHANGE:
              this.roomdata.host = event.payload;
              break;
            case EventType.TIMER:
              console.log(event.payload?.timerType);
              this.roomdata.timerState = event.payload;
              if (!event.payload) this.stopTimer();
              else this.startTimer();
              break;
            case EventType.TOGGLELOCK:
              if (!this.roomdata) return;
              this.roomdata.locked = event.payload;
              break;
            case EventType.GATHER_DATA:
              if (!this.roomdata) return;
              this.submitAnswers();
              break;
            case EventType.UPDATE:
              switch (event.payload.type) {
                case UpdateDataType.LETTER_DRAWN:
                  this.roomdata.gameSpecificData.startingLetter =
                    event.payload.letter;
                  break;
                case UpdateDataType.ROUND_END:
                  this.roomdata.gameSpecificData = {};
                  break;
              }
              break;
          }
          this.detectChanges();
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
