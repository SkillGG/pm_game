import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.less'],
})
export class LoginComponent {
  animlen = 0.45;
  @Output() loggingIn: EventEmitter<string> = new EventEmitter();
  login(name: string) {
    this.loggingIn.emit(name);
  }
  animationStart(
    btn: HTMLButtonElement,
    box: HTMLDivElement,
    usr: HTMLInputElement
  ) {
    btn.classList.add('hiding');
    setTimeout(() => {
      btn.classList.add('hid');
      btn.classList.remove('hiding');
      box.classList.remove('hid');
      box.classList.add('showing');
      setTimeout(() => {
        box.classList.remove('showing');
        usr.onfocus = () => {
          box.classList.add('outlined');
        };
        usr.onblur = () => box.classList.remove('outlined');
      }, this.animlen * 1000);
    }, this.animlen * 1000);
  }
}
