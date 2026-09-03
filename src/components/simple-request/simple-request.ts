import { Component,EventEmitter, inject, Output, output } from '@angular/core';
import { FormsModule } from "@angular/forms";
import { SimpleRequestDTO } from '../../Models/simple-request';
import { Router } from '@angular/router';

@Component({
  selector: 'app-simple-request',
  imports: [FormsModule],
  templateUrl: './simple-request.html',
  styleUrl: './simple-request.css',
})
export class SimpleRequest {
  simpleReq:SimpleRequestDTO={} as SimpleRequestDTO
  router = inject(Router)
  @Output() submitted = new EventEmitter<void>();

  SendRequest(){
    console.log(this.simpleReq)
    this.router.navigate(['/results'])
  }
}
