import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HubComponent } from './hub/hub.component';
import { LoginComponent } from './login/login.component';
import { RoomListComponent } from './room-list/room-list.component';
import { GameRoomComponent } from './game-room/game-room.component';
import { LetterShufflerComponent } from './letter-shuffler/letter-shuffler.component';
import { GameTimerComponent } from './game-timer/game-timer.component';

@NgModule({
  declarations: [
    AppComponent,
    HubComponent,
    LoginComponent,
    RoomListComponent,
    GameRoomComponent,
    LetterShufflerComponent,
    GameTimerComponent,
  ],
  imports: [BrowserModule, AppRoutingModule, FormsModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
