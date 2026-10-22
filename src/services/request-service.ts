import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { SimpleRequestDTO } from '../Models/simple-request';
import { delay, Observable, of, switchMap, takeWhile, timer,map } from 'rxjs';
import { RequestStatus } from '../Models/request-status';
import { Status } from '../Models/status';
import { SimulationRequestDto } from '../Models/simulation-request-dto';
import { ResultDto } from '../Models/simulation-result-dto';
import { DetailedRequestDto } from '../Models/detailed-request-dto';


@Injectable({
  providedIn: 'root',
})
export class RequestService {
  http = inject(HttpClient)
  private url='http://localhost:8080/api/simulation'

  CreateRequest(simpleReq:SimpleRequestDTO|null,detailedReq:DetailedRequestDto|null){
    let req:SimulationRequestDto = {simpleRequest:simpleReq,detailedRequest:detailedReq}
    this.validateRequest(detailedReq);
    console.log(JSON.stringify(req,null,2))
    return this.http.post(`${this.url}/start`,req,{responseType:'text'})
  }
  
  private validateRequest(req:DetailedRequestDto | null): void {
    let errors: string[] = [];
    if (!req) throw new Error('Request cannot be null');
    if (!req.datacenters || req.datacenters.length === 0) errors.push('At least one datacenter is required');
    if (!req.vms || req.vms.length === 0) errors.push('At least one VM is required');
    if (!req.cloudlets || req.cloudlets.length === 0) errors.push('At least one cloudlet is required');
    if (req.datacenters.some(dc => !dc.hosts || dc.hosts.length === 0)) errors.push('Each datacenter must have at least one host');
    if (req.vms.some(vm => vm.pes <= 0 || vm.mips <= 0 || vm.ram <= 0)) errors.push('Each VM must have positive values for pes, mips, and ram');
    if (req.cloudlets.some(cloudlet => cloudlet.pes <= 0 || cloudlet.length <= 0)) errors.push('Each cloudlet must have positive values for pes and length');
    if (req.datacenters.some(dc => !dc.costPerSec || dc.costPerSec <= 0)) errors.push('Each datacenter must have a positive cost per second');
    if (req.datacenters.some(dc=>dc.hosts.some(host=> host.bw<=0 || host.mips<=0 || host.pes <=0 || host.ram<=0 || host.storage <=0 ))) errors.push('Every parameter of host must be greater than 0')
    if (errors.length > 0) throw new Error(errors.join('.\n'));
  }

  pollRequest(id: string): Observable<string> {
    return timer(0, 2000).pipe(
      switchMap(() =>
        this.http.get(`${this.url}/status/${id}`, { responseType: 'text' })
      ),      
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

