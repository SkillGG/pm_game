import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import * as EventEmitter from 'events';

@Component({
  selector: 'app-letter-shuffler',
  templateUrl: './letter-shuffler.component.html',
  styleUrls: ['./letter-shuffler.component.less'],
})
export class LetterShufflerComponent {
  letter: string = '';
  @Input() availableLetters: string = 'abcdefghijklmnopqrstuvwxyz';
  @Input() timerStartListener: EventEmitter = new EventEmitter();
  constructor() {
    console.log('letter shuffler const.');
  }
  ngOnInit() {
    this.timerStartListener.on('refresh', () => {
      this.letter =
        this.availableLetters[
          Math.floor(Math.random() * (this.availableLetters.length - 1))
        ];
    });
  }
}
