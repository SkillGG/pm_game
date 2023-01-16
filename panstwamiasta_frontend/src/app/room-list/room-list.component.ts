import { Component, EventEmitter, Input, Output } from '@angular/core';
import { getRoomListOutput } from '../../../../integration/routebacks';

@Component({
  selector: 'app-room-list',
  templateUrl: './room-list.component.html',
  styleUrls: ['./room-list.component.less'],
})
export class RoomListComponent {
  @Input() rooms: getRoomListOutput = [];
  @Output() connectOut: EventEmitter<number> = new EventEmitter();
  @Output() refreshOut: EventEmitter<undefined> = new EventEmitter();
  connectTo(roomId: number) {
    this.connectOut.emit(roomId);
  }
  refresh() {
    this.refreshOut.emit();
  }
}
