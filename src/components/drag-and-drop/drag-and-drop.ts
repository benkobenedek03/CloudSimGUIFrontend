import { Component, ElementRef, inject, OnInit, signal, ViewChild } from '@angular/core';
import { DatacenterDTO } from '../../Models/datacenter-dto';
import { HostDTO } from '../../Models/host-dto';
import { DetailedRequestDto } from '../../Models/detailed-request-dto';
import { VmDTO } from '../../Models/vm-dto';
import { CloudletDTO } from '../../Models/cloudlet-dto';
import { CdkDragDrop, moveItemInArray, copyArrayItem } from '@angular/cdk/drag-drop';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { RequestService } from '../../services/request-service';
import { Router } from '@angular/router';



@Component({
  selector: 'app-drag-and-drop',
  imports: [DragDropModule, ReactiveFormsModule],
  templateUrl: './drag-and-drop.html',
  styleUrl: './drag-and-drop.css',
})
export class DragAndDrop implements OnInit {

  private requestService = inject(RequestService);
  private router = inject(Router)

  isLoading = signal(false);

  ngOnInit(): void {
    this.displayDataCenter = this.defaultDataCenter;
  }

  defaultDataCenter: DatacenterDTO = {
    costPerBw: 0.0,
    costPerMem: 0.0,
    costPerStorage: 0.0,
    costPerSec: 0.0,
    hosts: [{ bw: 0, customSchedulerClass: '', mips: 0, pes: 0, ram: 0, storage: 0, vmScheduler: '' }],
    name: 'Default Data Center',
  } as DatacenterDTO;

  displayDataCenter: DatacenterDTO = {} as DatacenterDTO;


  // 1. PALETTA: Előregyártott "Sane Default" sablonok
  hostPalette: HostDTO[] = [
    { pes: 4, mips: 1000, ram: 16384, bw: 10000, storage: 1000000, vmScheduler: 'TimeShared' },
    { pes: 8, mips: 1000, ram: 16384, bw: 10000, storage: 1000000, vmScheduler: 'TimeShared' },
    { pes: 16, mips: 1000, ram: 16384, bw: 10000, storage: 1000000, vmScheduler: 'TimeShared' }
  ];

  // 2. A SZIMULÁCIÓ ÁLLAPOTA (Ebből lesz a JSON)
  datacenters: DatacenterDTO[] = [];
  vms: VmDTO[] = [];
  cloudlets: CloudletDTO[] = [];

  // Dinamikus ID-k a Drop Zónák összekötéséhez
  get datacenterDropZoneIds(): string[] {
    return this.datacenters.map((_, index) => `dc-${index}`);
  }

  // --- INFRASTRUKTÚRA METÓDUSOK ---
  addDatacenter() {
    this.datacenters.push({
      name: `Datacenter_${this.datacenters.length + 1}`,
      costPerSec: 3.0, costPerMem: 0.05, costPerStorage: 0.001, costPerBw: 0.0,
      hosts: []
    });
  }

  dropHost(event: CdkDragDrop<HostDTO[]>) {
    if (event.previousContainer === event.container) {
      // Sorrend cseréje ugyanazon az adatközponton belül
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      // Klónozás a palettáról az adatközpontba
      copyArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
      // Mélymásolat, hogy ne hivatkozásként (reference) kerüljön be
      const copiedItem = { ...event.container.data[event.currentIndex] };
      event.container.data[event.currentIndex] = copiedItem;
    }
  }

  // --- WORKLOAD (BROKER) METÓDUSOK ---
  addVm() {
    this.vms.push({ id: this.vms.length + 1, mips: 1000, pes: 2, ram: 2048, bw: 1000, size: 10000 });
  }

  addCloudlet() {
    this.cloudlets.push({ id: this.cloudlets.length + 1, length: 50000, pes: 1, fileSize: 300, outputSize: 300 });
  }

  // --- SZIMULÁCIÓ INDÍTÁSA (Szerializáció) ---
  startSimulation() {
    try {
      const payload: DetailedRequestDto = {
        datacenters: this.datacenters,
        vms: this.vms,
        cloudlets: this.cloudlets
      };

      this.isLoading.set(true); // Töltés indikátor (Spinner) bekapcsolása

      // 1. Kérés indítása (A validateRequest itt fut le szinkron módon!)
      this.requestService.CreateRequest(null, payload).subscribe({
        
        // 2/A. Sikeres szerver válasz
        next: (response) => {
          this.isLoading.set(false); // Siker esetén is leállítjuk a töltést
          console.log('Sikeres kérés:', response);
          this.router.navigate(['results', response]);
        },
        
        // 2/B. Aszinkron Backend Hiba (pl. 400 Bad Request, 500 Internal Server Error)
        error: (httpError) => {
          this.isLoading.set(false);          
          // HTTP hibaüzenet intelligens kinyerése
          this.errorMessage = httpError.error?.message || httpError.message || 'Hiba történt a szerverrel való kommunikáció során.';
          this.router.navigate(['results', httpError]);
          this.errorModal.nativeElement.showModal();
        }
      });
      
    } catch (validationError) {
      // 3. Szinkron Kliensoldali Hiba (Amit a validateRequest() dobott)
      this.isLoading.set(false);
      
      this.errorMessage = (validationError as Error).message;
      
      // Hiba popup megjelenítése a frontend validáció miatt
      this.errorModal.nativeElement.showModal();
    }
  }



  // Hivatkozás a HTML-ben lévő <dialog> elemre
  @ViewChild('hostModal') hostModal!: ElementRef<HTMLDialogElement>;
  @ViewChild('vmModal') vmModal!: ElementRef<HTMLDialogElement>;
  @ViewChild('cloudletModal') cloudletModal!: ElementRef<HTMLDialogElement>;
  @ViewChild('datacenterModal') datacenterModal!: ElementRef<HTMLDialogElement>;
  @ViewChild('errorModal') errorModal!: ElementRef<HTMLDialogElement>;
  
  
  errorMessage: string = '';
  datacenterForm: FormGroup;
  selectedDatacenter: DatacenterDTO | null = null;

  hostForm: FormGroup;
  vmForm: FormGroup;
  cloudletForm: FormGroup;

  // Kiválasztott elemek (referenciák)
  selectedHost: HostDTO | null = null;
  selectedVm: VmDTO | null = null;
  selectedCloudlet: CloudletDTO | null = null;

  constructor(private fb: FormBuilder) {
    // 1. Az űrlap definíciója és kezdőértékei
    this.hostForm = this.fb.group({
      pes: [1],
      mips: [1000],
      ram: [2048],
      bw: [10000],
      storage: [1000000],
      vmScheduler: ['TimeShared']
    });
    this.vmForm = this.fb.group({
      pes: [2],
      mips: [1000],
      ram: [2048],
      bw: [1000],
      size: [10000],
      cloudletScheduler: ['TimeShared']
    });
    this.cloudletForm = this.fb.group({
      length: [50000],
      pes: [1],
      fileSize: [300],
      outputSize: [300]
    });
    this.datacenterForm = this.fb.group({
      name: [''],
      costPerSec: [3.0],
      costPerMem: [0.05],
      costPerStorage: [0.001],
      costPerBw: [0.0]
    });
  }
  closeErrorModal() {
    this.errorModal.nativeElement.close();
    this.errorMessage = '';
  }

  // --- VM VEZÉRLÉS ---
  openVmSettings(vm: VmDTO) {
    this.selectedVm = vm;
    this.vmForm.patchValue(vm);
    this.vmModal.nativeElement.showModal();
  }

  saveVmSettings() {
    if (this.selectedVm && this.vmForm.valid) {
      Object.assign(this.selectedVm, this.vmForm.value);
      this.closeVmModal();
    }
  }

  closeVmModal() {
    this.vmModal.nativeElement.close();
    this.selectedVm = null;
  }

  // --- CLOUDLET VEZÉRLÉS ---
  openCloudletSettings(cloudlet: CloudletDTO) {
    this.selectedCloudlet = cloudlet;
    this.cloudletForm.patchValue(cloudlet);
    this.cloudletModal.nativeElement.showModal();
  }

  saveCloudletSettings() {
    if (this.selectedCloudlet && this.cloudletForm.valid) {
      Object.assign(this.selectedCloudlet, this.cloudletForm.value);
      this.closeCloudletModal();
    }
  }

  closeCloudletModal() {
    this.cloudletModal.nativeElement.close();
    this.selectedCloudlet = null;
  }


  // Ezt hívja meg a kártyán lévő ⚙️ gomb
  openHostSettings(host: HostDTO) {
    this.selectedHost = host;
    this.hostForm.patchValue(host); // Betöltjük a kártya adatait az űrlapba
    this.hostModal.nativeElement.showModal(); // Megnyitjuk a daisyUI modalt
  }

  // Ezt hívja meg a form Mentés gombja
  saveHostSettings() {
    if (this.selectedHost && this.hostForm.valid) {
      // Frissítjük a memóriában lévő objektumot az űrlap adataival
      Object.assign(this.selectedHost, this.hostForm.value);
      this.closeModal();
    }
  }

  closeModal() {
    this.hostModal.nativeElement.close();
    this.selectedHost = null;
  }

  openDatacenterSettings(dc: DatacenterDTO) {
    this.selectedDatacenter = dc;
    this.datacenterForm.patchValue(dc);
    this.datacenterModal.nativeElement.showModal();
  }

  saveDatacenterSettings() {
    if (this.selectedDatacenter && this.datacenterForm.valid) {
      Object.assign(this.selectedDatacenter, this.datacenterForm.value);
      this.closeDatacenterModal();
    }
  }

  closeDatacenterModal() {
    this.datacenterModal.nativeElement.close();
    this.selectedDatacenter = null;
  }

}
