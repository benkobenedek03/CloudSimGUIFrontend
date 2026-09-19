import { Component, inject, input, OnInit } from '@angular/core';
import { RequestService } from '../../services/request-service';

@Component({
  selector: 'app-result',
  imports: [],
  templateUrl: './result.html',
  styleUrl: './result.css',
})
export class Result implements OnInit {
  ngOnInit(): void {
    if (this.jobId()) {
      this.service.getResult(this.jobId()).subscribe({
        next:result=>{console.log(result)},
        error:error=>console.log(error)
      })
    }
  }
  jobId=input<string>()
  service = inject(RequestService)

  
  
}
