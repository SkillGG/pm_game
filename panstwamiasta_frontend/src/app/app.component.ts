import { Component, ViewChild } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less'],
})
export class AppComponent {
  title = 'panstwamiasta_frontend';
  page: number;
  username: string | null = null;
  constructor() {
    this.username = localStorage.getItem('loggedInAs');
    this.page = this.username ? 1 : 0;
  }
  login(name: string) {
    if (name) {
      this.username = name;
      this.page = 1;
      localStorage.setItem('loggedInAs', name);
    }
  }
  logout() {
    if (this.username) {
      this.username = '';
      this.page = 0;
      localStorage.removeItem('loggedInAs');
    }
  }
}
