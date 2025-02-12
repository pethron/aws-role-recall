import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private databaseSubject = new BehaviorSubject<any>({});
  database$ = this.databaseSubject.asObservable();

  constructor() {
    this.loadDatabase();
    this.listenForStorageChanges();
  }

  private loadDatabase() {
    chrome.storage.local.get("database", (result) => {
        if (chrome.runtime.lastError) {
            console.error("Error fetching storage:", chrome.runtime.lastError);
            return;
          }
        const database = result.database || {};
        this.databaseSubject.next(database);
    });
  }

  private listenForStorageChanges() {
    chrome.storage.onChanged.addListener((changes) => {
      if (changes.database) {
        this.loadDatabase();
      }
    });
  }
}
