import { Component, inject, input } from '@angular/core';
import { RequestService } from '../../services/request-service';

@Component({
  selector: 'app-result',
  imports: [],
  templateUrl: './result.html',
  styleUrl: './result.css',
})
export class Result {
  jobId=input.required<string>()
  service = inject(RequestService)

  
}
