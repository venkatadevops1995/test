import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {

  currnet__year : number;

  constructor() { }

  ngOnInit(): void {
    this.currnet__year = new Date().getFullYear();
    
  }

}
