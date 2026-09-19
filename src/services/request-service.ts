import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { SimpleRequestDTO } from '../Models/simple-request';
import { delay, Observable, of, switchMap, takeWhile, timer,map } from 'rxjs';
import { RequestStatus } from '../Models/request-status';
import { Status } from '../Models/status';
import { SimulationRequestDto } from '../Models/simulation-request-dto';
import { ResultDto } from '../Models/simulation-result-dto';


@Injectable({
  providedIn: 'root',
})
export class RequestService {
  http = inject(HttpClient)
  private url='http://localhost:8080/api/simulation'

  CreateRequest(simpleReq:SimpleRequestDTO|null,detailedReq:string|null){
    let req:SimulationRequestDto = {simpleRequest:simpleReq,detailedRequest:detailedReq}
    console.log(req)
    return this.http.post(`${this.url}/start`,req,{responseType:'text'})
  }
  
  pollRequest(id: string): Observable<string> {
    return timer(0, 2000).pipe(
      switchMap(() =>
        this.http.get(`${this.url}/status/${id}`, { responseType: 'text' })
      ),
      //map((statusStr: string) => statusStr.replace(/["']/g, '').trim()),
      // Addig fut, amíg el nem éri a végállapotot (a `true` miatt az utolsót még kibocsátja)
      takeWhile(
        (status: string) =>
          status.toUpperCase() !== 'COMPLETED' &&
          status.toUpperCase() !== 'FAILED',
        true
      )
    );
  }

  getResult(id:string | undefined){
    return this.http.get<ResultDto>(this.url+"/result/"+id)
  }
}

