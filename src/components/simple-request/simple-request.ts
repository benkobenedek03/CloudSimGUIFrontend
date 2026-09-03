import { Component,EventEmitter, inject, Output, output } from '@angular/core';
import { FormsModule } from "@angular/forms";
import { SimpleRequestDTO } from '../../Models/simple-request';
import { Router } from '@angular/router';
import { RequestService } from '../../services/request-service';

@Component({
  selector: 'app-simple-request',
  imports: [FormsModule],
  templateUrl: './simple-request.html',
  styleUrl: './simple-request.css',
})
export class SimpleRequest {
  simpleReq:SimpleRequestDTO={} as SimpleRequestDTO
  router = inject(Router)
  service = inject(RequestService)
  loading = false
  @Output() submitted = new EventEmitter<void>();

  SendRequest(){
    console.log(this.simpleReq)
    this.loading = true
    //this.service.CreateRequest(this.simpleReq)
    this.service.pollRequest('ad').subscribe({
      next:response=>{
        this.loading=false
        console.log(response)
        this.router.navigate(['/results'])
      },
      error: error=>{
        this.loading=false
        console.log(error)
      }
    })
   
  }
}
