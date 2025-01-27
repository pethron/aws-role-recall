import { Component, OnInit } from '@angular/core';
import { XmlParserService } from './services/xml-parser.service';

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
    chrome.storage.local.get(['providers'], (result) => {
      console.log(result.providers);
      result.providers.forEach((provider: { id: string, samlResponse: string; }) => {
        
        const doc = XmlParserService.parseXml(provider.samlResponse);
        const roles = XmlParserService.extractValues(doc);
        console.log("roles", roles);
       });
    });
  }
  
  onClick() {
    console.log('Button was clicked!');
    alert('Extension iss working!');
  } 
}