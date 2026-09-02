import { Component,EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-detailed-request',
  imports: [FormsModule],
  templateUrl: './detailed-request.html',
  styleUrl: './detailed-request.css',
})
export class DetailedRequest {
  config:string=""
  @Output() submitted=new EventEmitter<void>();
  SendRequest()
  {
    //todo service api call
    this.submitted.emit();
  }
}
