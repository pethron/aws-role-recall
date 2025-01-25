import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent implements OnInit {
  title = 'aws-role-recall';

  parsedRoles: string[] = [];
  errorMessage: string | null = null;

  ngOnInit(): void {
    chrome.storage.local.get(['samlResponse'], (result) => {
      
   })
  }
  

  onClick() {
    console.log('Button was clicked!');
    alert('Extension is working!');
  } 
}