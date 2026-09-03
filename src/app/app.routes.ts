import { Routes } from '@angular/router';
import { SimpleRequest } from '../components/simple-request/simple-request';
import { Result } from '../components/result/result';
import { DetailedRequest } from '../components/detailed-request/detailed-request';

export const routes: Routes = [
    {
        path:'', component: SimpleRequest
    },
    {
        path:'simple', component: SimpleRequest
    },
    {
        path:'detailed', component: DetailedRequest
    },
    {
        path:'results', component: Result
    },
];
