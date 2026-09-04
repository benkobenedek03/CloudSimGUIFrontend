import { Component,EventEmitter, inject, Output, output, signal, WritableSignal } from '@angular/core';
import { FormsModule } from "@angular/forms";
import { SimpleRequestDTO } from '../../Models/simple-request';
import { Router } from '@angular/router';
import { RequestService } from '../../services/request-service';
import { Successpopup } from "../popups/successpopup/successpopup";
import { Alertpopup } from "../popups/alertpopup/alertpopup";

@Component({
  selector: 'app-simple-request',
  imports: [FormsModule, Successpopup, Alertpopup],
  templateUrl: './simple-request.html',
  styleUrl: './simple-request.css',
})
export class SimpleRequest {
  simpleReq:SimpleRequestDTO={} as SimpleRequestDTO
  router = inject(Router)
  service = inject(RequestService)
  loading = false

  //popup
  successPopupVisible = signal(false)
  alertPopupVisible = signal(false)
  message=""

  @Output() submitted = new EventEmitter<void>();

  showPopup(popup:WritableSignal<boolean>){
    popup.set(true)

    setInterval(() => {
      popup.set(false)
    }, 5000);
  }

  closePopups(){
    this.alertPopupVisible.set(false)
    this.successPopupVisible.set(false)
  }


  SendRequest(){
    console.log(this.simpleReq)
    this.loading = true
    
    //this.service.CreateRequest(this.simpleReq)
    this.service.pollRequest('ad').subscribe({
      next:response=>{
        this.message="Simulation started"
        this.showPopup(this.successPopupVisible)
        this.loading=false
        console.log(response)
        setInterval(() => {
          this.router.navigate(['/results'])
        }, 3000);        
      },
      error: error=>{
        this.loading=false
        console.log(error)
        this.message="Something went wrong. Try again!"
        this.showPopup(this.alertPopupVisible)
      }
    })
   
  }
}
