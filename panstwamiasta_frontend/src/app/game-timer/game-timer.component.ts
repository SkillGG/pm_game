import { Component, Input } from '@angular/core';
import { EventEmitter } from 'events';
import { TimerType } from '../../../../integration/roomevents';

@Component({
  selector: 'app-game-timer',
  templateUrl: './game-timer.component.html',
  styleUrls: ['./game-timer.component.less'],
})
export class GameTimerComponent {
  @Input() time: string = '';
  @Input() type?: TimerType;
  @Input() tick: number = 0;
  timerListener = new EventEmitter();
  constructor() {}
  ngOnChanges() {
    if (this.type == TimerType.DRAW_LETTER) this.timerListener.emit('refresh');
  }
}
