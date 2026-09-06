import { Component, EventEmitter, inject, Output, output, signal, WritableSignal } from '@angular/core';
import { FormsModule } from "@angular/forms";
import { SimpleRequestDTO } from '../../Models/simple-request';
import { Router } from '@angular/router';
import { RequestService } from '../../services/request-service';
import { Successpopup } from "../popups/successpopup/successpopup";
import { Alertpopup } from "../popups/alertpopup/alertpopup";
import { Status } from '../../Models/status';

@Component({
  selector: 'app-simple-request',
  imports: [FormsModule, Successpopup, Alertpopup],
  templateUrl: './simple-request.html',
  styleUrl: './simple-request.css',
})
export class SimpleRequest {
  simpleReq: SimpleRequestDTO = {
    datacenterCount: 1,
    hostCount: 2,
    vmCount: 4,
    cloudletCount: 10,
    hostMips: 10000,
    hostPes: 4,
    hostRam: 16384,
    vmMips: 2000,
    vmPes: 2,
    vmRam: 4096,
    cloudletLength: 10000,
    cloudletPes: 1,
    schedulingPolicy: 'TIME_SHARED'
  } as SimpleRequestDTO;
  router = inject(Router);
  service = inject(RequestService);
  loading = signal(false);
  jobId = "";


  //popup
  successPopupVisible = signal(false)
  alertPopupVisible = signal(false)
  message = ""

  @Output() submitted = new EventEmitter<void>();

  showPopup(popup: WritableSignal<boolean>) {
    popup.set(true)

    setInterval(() => {
      popup.set(false)
    }, 5000);
  }

  closePopups() {
    this.alertPopupVisible.set(false)
    this.successPopupVisible.set(false)
  }


  SendRequest() {
  console.log('Küldött adatok:', this.simpleReq);
  this.loading.set(true);

  this.service.CreateRequest(this.simpleReq, null).subscribe({
    next: (jobId: string) => {
      console.log('Megkapott Job ID:', jobId);
      this.jobId = jobId;

      // Polling indítása a megkapott ID-val
      this.service.pollRequest(this.jobId).subscribe({
        next: (status: string) => {
          console.log('Aktuális szimulációs státusz:', status);

          if (status.toUpperCase() === "COMPLETED") {
            // CSAK AKKOR állítjuk le a loadingot, ha tényleg befejeződött a szimuláció
            this.loading.set(false);
            this.message = 'Simulation completed successfully!';
            this.showPopup(this.successPopupVisible);

            // Egyszeri átirányítás 2 másodperc múlva a jobId átadásával
            setTimeout(() => {
              this.router.navigate(['/results'], { queryParams: { jobId: this.jobId } });
            }, 2000);

          } else if (status.toUpperCase() === "FAILED") {
            this.loading.set(false);
            this.message = 'Simulation failed on backend!';
            this.showPopup(this.alertPopupVisible);
          } else {
            // Pending vagy Running állapot közben a loading marad true
            console.log(`Szimuláció folyamatban: ${status}`);
          }
        },
        error: (pollErr) => {
          this.loading.set(false);
          console.error('Polling hiba:', pollErr);
          this.message = 'Status polling failed. Please check network!';
          this.showPopup(this.alertPopupVisible);
        }
      });
    },
    error: (err) => {
      this.loading.set(false);
      console.error('Kérés indítási hiba:', err);
      this.message = 'Failed to start simulation!';
      this.showPopup(this.alertPopupVisible);
    }
  });
}
}
