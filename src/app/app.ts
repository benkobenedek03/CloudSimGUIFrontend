import { Component, signal } from '@angular/core';
import { ViewTypes } from '../Models/view-types';
import { RouterOutlet } from "@angular/router";
import { Nav } from "../components/nav/nav";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Nav],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  viewtype:ViewTypes=ViewTypes.simple
  ViewTypes=ViewTypes

  ChangeView(view:ViewTypes){
    this.viewtype=view
  }

  SwitchToResults(){
    this.ChangeView(ViewTypes.result)
  }

}
