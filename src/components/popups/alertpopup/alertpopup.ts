import { Component, EventEmitter, input, Output } from '@angular/core';

@Component({
  selector: 'app-alertpopup',
  imports: [],
  templateUrl: './alertpopup.html',
  styleUrl: './alertpopup.css',
})
export class Alertpopup {
  message=input.required()
  @Output() closeEvent = new EventEmitter<void>()
  
  close(){
    this.closeEvent.emit()
  }
}
