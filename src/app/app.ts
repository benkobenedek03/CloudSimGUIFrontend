import { Component, signal } from '@angular/core';
import { SimpleRequest } from '../components/simple-request/simple-request';
import { DetailedRequest } from '../components/detailed-request/detailed-request';
import { Result } from '../components/result/result';
import { ViewTypes } from '../Models/view-types';

@Component({
  selector: 'app-root',
  imports: [SimpleRequest,DetailedRequest,Result],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  viewtype:ViewTypes=ViewTypes.simple
  ViewTypes=ViewTypes

  ChangeView(view:ViewTypes){
    this.viewtype=view
  }

}
