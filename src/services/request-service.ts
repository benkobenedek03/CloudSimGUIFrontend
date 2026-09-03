import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { SimpleRequestDTO } from '../Models/simple-request';
import { Observable, switchMap, takeWhile, timer } from 'rxjs';
import { RequestStatus } from '../Models/request-status';
import { Status } from '../Models/status';

@Injectable({
  providedIn: 'root',
})
export class RequestService {
  http = inject(HttpClient)
  private url='localhost:5000/api/'

  CreateRequest(req:SimpleRequestDTO){
    this.http.post<SimpleRequestDTO>(`${this.url}/start`,req)
  }
  
  pollRequest(id: string): Observable<RequestStatus> {
    return timer(0, 2000).pipe(
      switchMap(() =>
        this.http.get<RequestStatus>(
          `${this.url}/requests/${id}`
        )
      ),
      takeWhile(
        response =>
          response.status !== Status.completed&&
          response.status !== Status.failed,
        true
      )
    );
  }
}
