import { Room } from "../integration/room";

export class Hub {
  static rooms: Room[] = [new Room()];
  static addRoom(r: Room) {
    this.rooms.push(r);
  }
  static getRoom(id:number){
    return this.rooms.find(r=>r.id===id);
  }
}