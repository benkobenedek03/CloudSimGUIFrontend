import { Component } from '@angular/core';

@Component({
  selector: 'app-simple-request',
  imports: [],
  templateUrl: './simple-request.html',
  styleUrl: './simple-request.css',
})
export class SimpleRequest {
  private simpleReq:SimpleRequest={} as SimpleRequest
  
  SendRequest(){}
}
