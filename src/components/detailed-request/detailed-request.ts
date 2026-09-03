import { Component,EventEmitter, inject, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-detailed-request',
  imports: [FormsModule],
  templateUrl: './detailed-request.html',
  styleUrl: './detailed-request.css',
})
export class DetailedRequest {
  config:string=""
  router = inject(Router)
  SendRequest()
  {
    //todo service api call
    this.router.navigate(['/results'])
  }
}
