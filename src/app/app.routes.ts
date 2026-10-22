import { Routes } from '@angular/router';
import { SimpleRequest } from '../components/simple-request/simple-request';
import { Result } from '../components/result/result';
import { DetailedRequest } from '../components/detailed-request/detailed-request';
import { DragAndDrop } from '../components/drag-and-drop/drag-and-drop';

export const routes: Routes = [
    {
    // Alapértelmezett oldal (Tervező felület)
    path: '',
    component: DragAndDrop,
    title: 'CloudSim Web'
  },
  {
    path: 'results/:jobId',
    component: Result,
    title: 'Szimulációs Eredmények'
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full'
  }
];
