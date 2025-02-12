import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StorageService } from '../../services/storage.service';

interface Role {
  roleArn: string;
  providerArn: string;
  accountNumber: string;
  accountName?: string;
  name?: string;
}

interface DatabaseEntry {
  roles: Role[];
}

@Component({
  selector: 'app-roles-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './roles-list.component.html',
  styleUrls: ['./roles-list.component.scss']
})

export class RolesListComponent implements OnInit {
  database: { [id: string]: DatabaseEntry } = {};

  private storageService = inject(StorageService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.storageService.database$.subscribe((database) => {
        if (database) {
            this.database = database;
            console.log("Database loaded:", this.database);
            this.cdr.detectChanges();
        } else {
            console.warn("No database found in storage.");
            this.database = {};
        }
    });
  }

  getKeys(): string[] {
    return Object.keys(this.database);
  }

  getRoles(providerId: string): Role[] {
    return this.database[providerId]?.roles || [];
  }
}
