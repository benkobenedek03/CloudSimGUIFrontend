import { RequestService } from '../../services/request-service';
import { ResultDto } from '../../Models/simulation-result-dto';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ChartConfiguration, ChartType } from 'chart.js';
import { Component, OnInit, inject, ChangeDetectorRef, ViewChild, ViewChildren, QueryList } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';

@Component({
  selector: 'app-result',
  imports: [CommonModule, RouterModule, BaseChartDirective],
  templateUrl: './result.html',
  styleUrl: './result.css',
})
export class Result implements OnInit {

  private route = inject(ActivatedRoute);
  private requestService = inject(RequestService);
  
  private cdr = inject(ChangeDetectorRef);

  // 2. ÚJDONSÁG: Referencia a grafikonokhoz (mivel kettő van, a ViewChildren a biztos)
  @ViewChildren(BaseChartDirective) charts?: QueryList<BaseChartDirective>;

  jobId: string | null = null;
  isLoading: boolean = true;
  errorMessage: string | null = null;
  resultData: ResultDto | null = null;

  // --- GRAFIKON KONFIGURÁCIÓK ---
  
  // 1. Oszlopdiagram (Feladatok futási ideje)
  public barChartType: ChartType = 'bar';
  public barChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [{ data: [], label: 'Futási idő (másodperc)', backgroundColor: '#3abff8', borderRadius: 4 }]
  };
  public barChartOptions: ChartConfiguration['options'] = { 
    responsive: true,
    plugins: { title: { display: true, text: 'Feladatok (Cloudletek) izolált futási ideje' } }
  };

  // 2. Fánkdiagram (VM-ek közötti terheléseloszlás)
  public doughnutChartType: ChartType = 'doughnut';
  public doughnutChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [{ data: [], backgroundColor: ['#36d399', '#fbbd23', '#f87272', '#a991f7', '#ff9900'] }]
  };
  public doughnutChartOptions: ChartConfiguration['options'] = { 
    responsive: true,
    plugins: { title: { display: true, text: 'Terheléseloszlás (VM Kihasználtság)' } }
  };

  ngOnInit() {
    // Job ID kiolvasása az URL-ből (pl. /results/12345)
    this.jobId = this.route.snapshot.paramMap.get('jobId');

    if (this.jobId) {
      this.startPolling(this.jobId);
    } else {
      this.errorMessage = 'Nem található Job ID az URL-ben!';
      this.isLoading = false;
    }

    // this.jobId = "job-demo-98765";
    // this.resultData = this.generateMockResult();
    
    // Feldolgozzuk az adatokat a Chart.js-nek
    this.processChartData(); 
    
    // Leállítjuk a töltést (Loadert), hogy egyből a 3-as (Sikeres) nézet jelenjen meg
    this.isLoading = false;

  }

  // LÉPÉS 1: Aszinkron Polling a státusz lekérdezésére
  private startPolling(jobId: string) {
    this.isLoading = true;
    
    this.requestService.pollRequest(jobId).subscribe({
      next: (status: string) => {
        const currentStatus = status.trim().toUpperCase();
        console.log(`[Job: ${jobId}] Polling status: ${currentStatus}`);
        
        if (currentStatus === 'COMPLETED') {
          // Ha kész a szimuláció, megszakítjuk a pollingot és jöhet a 2. lépés!
          this.fetchFinalResult(jobId);
        } else if (currentStatus === 'FAILED') {
          this.errorMessage = 'A szimuláció végrehajtása hibára futott a szerveren.';
          this.isLoading = false;
        }
        // Ha PENDING vagy RUNNING, a loader továbbra is pörög.
      },
      error: (err) => {
        this.errorMessage = 'Hálózati hiba történt a státusz lekérdezése közben.';
        this.isLoading = false;
        console.error('Polling hiba:', err);
      }
    });
  }

  // LÉPÉS 2: A nagyméretű eredmény JSON letöltése
  private fetchFinalResult(jobId: string) {
    this.requestService.getResult(jobId).subscribe({
      next: (data: ResultDto) => {
        console.log('HTTP Válasz megérkezett:', data);
        
        // 1. Adat beállítása és feldolgozása
        this.resultData = data;
        this.processChartData(); 
        
        // 2. Töltőképernyő kikapcsolása
        this.isLoading = false;  
        
        // 3. Kényszerítjük az Angulart, hogy frissítse a HTML-t (pl. levegye a loadert és megjelenítse a kártyákat)
        this.cdr.detectChanges();

        // 4. Kényszerítjük a Chart.js grafikonokat a frissítésre
        if (this.charts) {
          this.charts.forEach(chart => chart.update());
        }
      },
      error: (err) => {
        this.errorMessage = 'A szimuláció lefutott, de az eredmény JSON letöltése sikertelen volt.';
        this.isLoading = false;
        console.error('Result fetch hiba:', err);
      }
    });

  }

  // ADATFELDOLGOZÁS A CHART.JS SZÁMÁRA
  private processChartData() {
    if (!this.resultData) return;

    const cloudletLabels: string[] = [];
    const execTimes: number[] = [];
    
    // Térkép a VM-ek terhelésének összesítéséhez (vmId -> összes execTime)
    const vmWorkloadMap = new Map<number, number>();

    this.resultData.cloudletResults.forEach(cl => {
      // Bar Chart adatok (Feladatonként)
      cloudletLabels.push(`CL-${cl.cloudletId}`);
      execTimes.push(cl.execTime);

      // Doughnut Chart adatok aggregálása (VM-enként)
      const currentWorkload = vmWorkloadMap.get(cl.vmId) || 0;
      vmWorkloadMap.set(cl.vmId, currentWorkload + cl.execTime);
    });

    // Új objektum referenciák átadása az ng2-charts reaktivitása miatt
    this.barChartData = { 
      ...this.barChartData, 
      labels: cloudletLabels, 
      datasets: [{ ...this.barChartData.datasets[0], data: execTimes }] 
    };

    const vmLabels = Array.from(vmWorkloadMap.keys()).map(id => `VM-${id}`);
    const vmData = Array.from(vmWorkloadMap.values());

    this.doughnutChartData = { 
      ...this.doughnutChartData, 
      labels: vmLabels, 
      datasets: [{ ...this.doughnutChartData.datasets[0], data: vmData }] 
    };
  }

  // Teszt adat a UI (Grafikonok, Táblázat) fejlesztéséhez
  private generateMockResult(): ResultDto {
    return {
      jobId: "job-demo-98765",
      totalExecutionTime: 125.45, // Másodperc
      totalCpuCost: 4.872,        // Dollár
      totalCloudlets: 5,
      successfulCloudlets: 4,
      cloudletResults: [
        {
          cloudletId: 1,
          status: "SUCCESS",
          vmId: 1,
          startTime: 0.1,
          finishTime: 45.6,
          execTime: 45.5
        },
        {
          cloudletId: 2,
          status: "SUCCESS",
          vmId: 1, // Ugyanazon a VM-en futott, mint az 1-es (pl. egymás után)
          startTime: 45.6,
          finishTime: 102.4,
          execTime: 56.8
        },
        {
          cloudletId: 3,
          status: "SUCCESS",
          vmId: 2, // Másik VM
          startTime: 0.2,
          finishTime: 125.45, // Ez tartott a legtovább
          execTime: 125.25
        },
        {
          cloudletId: 4,
          status: "FAILED", // Direkt egy sikertelen feladat a UI teszteléséhez
          vmId: 3,
          startTime: 0.1,
          finishTime: 12.5,
          execTime: 12.4
        },
        {
          cloudletId: 5,
          status: "SUCCESS",
          vmId: 3,
          startTime: 12.6,
          finishTime: 68.3,
          execTime: 55.7
        }
      ]
    };
  }
}
