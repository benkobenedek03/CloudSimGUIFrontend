import { Component, EventEmitter, Input, input, Output, signal } from '@angular/core';

@Component({
  selector: 'app-successpopup',
  imports: [],
  templateUrl: './successpopup.html',
  styleUrl: './successpopup.css',
})
export class Successpopup {
  message = input.required();
  @Output() closeEvent = new EventEmitter<void>()

  close(){
    this.closeEvent.emit()
  }
}
