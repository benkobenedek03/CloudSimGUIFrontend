import { Component,EventEmitter, inject, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RequestService } from '../../services/request-service';

@Component({
  selector: 'app-detailed-request',
  imports: [FormsModule],
  templateUrl: './detailed-request.html',
  styleUrl: './detailed-request.css',
})
export class DetailedRequest {
  config:string=""
  router = inject(Router)
  service = inject(RequestService)
  loading=false
  SendRequest()
  {
    this.loading = true
    this.service.pollRequest('a').subscribe({
      next:response=>{
        this.loading=false
        console.log(response)
        this.router.navigate(['/results'])
      },
      error: error => {
        console.log(error)
        this.loading = false;
      }
    })
    //todo service api call
    
  }
}
