import { Component,EventEmitter, inject, OnInit, Output, Signal, signal, WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RequestService } from '../../services/request-service';
import { Successpopup } from "../popups/successpopup/successpopup";
import { Alertpopup } from "../popups/alertpopup/alertpopup";


@Component({
  selector: 'app-detailed-request',
  imports: [FormsModule, Successpopup, Alertpopup],
  templateUrl: './detailed-request.html',
  styleUrl: './detailed-request.css',
})
export class DetailedRequest implements OnInit {
  defaultTemplate = {
    name: "Detailed Cloud Experiment",
    mode: "DETAILED",
    detailedRequest: {
      datacenters: [
        {
          name: "Datacenter_Budapest",
          costPerSec: 3.0,
          costPerMem: 0.05,
          costPerStorage: 0.001,
          costPerBw: 0.0,
          hosts: [
            {
              pes: 8,
              mips: 10000,
              ram: 32768,
              storage: 1000000,
              bw: 10000,
              vmScheduler: "TIME_SHARED"
            },
            {
              pes: 4,
              mips: 8000,
              ram: 16384,
              storage: 500000,
              bw: 10000,
              vmScheduler: "SPACE_SHARED"
            }
          ]
        }
      ],
      vms: [
        {
          id: 0,
          mips: 2500,
          pes: 2,
          ram: 4096,
          bw: 1000,
          size: 10000,
          cloudletScheduler: "TIME_SHARED"
        },
        {
          id: 1,
          mips: 2500,
          pes: 2,
          ram: 4096,
          bw: 1000,
          size: 10000,
          cloudletScheduler: "TIME_SHARED"
        },
        {
          id: 2,
          mips: 5000,
          pes: 4,
          ram: 8192,
          bw: 2000,
          size: 20000,
          cloudletScheduler: "SPACE_SHARED"
        }
      ],
      cloudlets: [
        {
          id: 0,
          length: 10000,
          pes: 1,
          fileSize: 300,
          outputSize: 300
        },
        {
          id: 1,
          length: 20000,
          pes: 2,
          fileSize: 500,
          outputSize: 500
        },
        {
          id: 2,
          length: 15000,
          pes: 1,
          fileSize: 300,
          outputSize: 300
        },
        {
          id: 3,
          length: 30000,
          pes: 2,
          fileSize: 1000,
          outputSize: 600
        }
      ]
    }
  };
  configString:string=''
  router = inject(Router)
  service = inject(RequestService)
  loading=false

  //popup
  alertPopupVisible = signal(false)
  successPopupVisible = signal(false)
  popupMessage = ""

  showPopup(popup:WritableSignal<boolean>){
    popup.set(true)
    
    setInterval(()=>{
      popup.set(false)
    },5000)
  }

  closePopups(){
    this.alertPopupVisible.set(false)
    this.successPopupVisible.set(false)
  }

  ngOnInit(): void {
    this.configString=JSON.stringify(this.defaultTemplate,null,2)
  }



  SendRequest()
  {
    this.loading = true
    console.log(this.configString)
    this.service.pollRequest('a').subscribe({
      next:response=>{
        this.loading=false
        this.popupMessage="Simulation started"
        this.showPopup(this.successPopupVisible)
        console.log(response)
        setInterval(() => {
          this.router.navigate(['/results'])
        }, 3000);
      },
      error: error => {
        console.log(error)
        this.popupMessage="Something went wrong. Try again!"
        this.loading = false;
        this.showPopup(this.alertPopupVisible)
      }
    })
    //todo service api call
    
  }
}
