import { Component, EventEmitter, Input, Output } from '@angular/core';
import Server from 'src/server_integration/server';
import { parseLocation } from 'src/utils';
import { ServerError } from 'src/../../integration/roomlist';
import { ActivatedRoute } from '@angular/router';
import { Room, RoomJSONData } from '../../../../integration/room';

@Component({
  selector: 'app-hub',
  templateUrl: './hub.component.html',
  styleUrls: ['./hub.component.less'],
})
export class HubComponent {
  @Input() name: string = '';
  loaded: boolean = false;
  error?: string;
  rooms?: RoomJSONData[];
  currentRoom?: RoomJSONData;
  @Output() logOut: EventEmitter<undefined> = new EventEmitter();
  constructor() {}
  ngOnInit() {
    this.refreshRoomList();
    setInterval(async () => {
      if (this.currentRoom) return;
      await this.refreshRoomList();
    }, 1000);
  }
  logout() {
    this.loaded = false;
    this.rooms = [];
    this.error = undefined;
    this.currentRoom = undefined;
    this.name = '';
    this.logOut.emit();
  }
  async refreshRoomList(noConnect = false) {
    const location = parseLocation();
    const {
      response: { status, data: roomList },
    } = await Server.getRoomList().catch((err: ServerError) => {
      return { response: { status: err.status, data: err.message } };
    });
    if (typeof roomList !== 'string') {
      this.rooms = roomList;
      this.loaded = true;
      const roomHasPlayer = this.rooms.find((r) =>
        r.connected.includes(this.name)
      );
      if (noConnect) return;
      if (roomHasPlayer) await this.connectTo(roomHasPlayer.id);
      else if (location.search.has('room'))
        await this.connectTo(parseInt(location.search.get('room') || ''));
    } else {
      this.loaded = false;
      this.error =
        roomList + '<br>Please reload using Ctrl+F5 or try again later';
    }
  }
  async connectTo(id: number) {
    if (!id) return;
    await this.refreshRoomList(true);
    const room = this.rooms?.find((r) => r.id === id);
    if (room) {
      window.history.pushState('', '', `?room=${id}`);
      this.currentRoom = room;
    } else {
      console.error("This room doesn't exist!");
    }
  }
  async disconnectFrom() {
    console.log('Disconnecting!', this.rooms);
    if (this.currentRoom) {
      await Server.disconnectFromRoom(this.currentRoom.id, this.name).catch(
        (err: ServerError) => {
          return { response: { status: err.status, data: err.message } };
        }
      );
      window.history.pushState('', '', '/');
      this.currentRoom = undefined;
      this.refreshRoomList();
    }
  }
}
