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

interface LastRequest {
    id: string;
    samlResponseBase64: string;
    samlResponseDecoded: string;
}

interface DatabaseEntry {
    lastRequest?: LastRequest;
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

    loginToAWS(providerId: string, roleArn: string): void {
        if (!this.database[providerId] || !this.database[providerId].lastRequest) {
          console.error("No SAML response found for provider:", providerId);
          return;
        }
      
        const samlResponseBase64 = this.database[providerId].lastRequest.samlResponseBase64;
        if (!samlResponseBase64) {
          console.error("SAML Response is missing.");
          return;
        }
      
        const relayState = encodeURIComponent(`https://signin.aws.amazon.com/switchrole?roleName=${roleArn.split('/')[1]}&account=${roleArn.split(':')[4]}`);
      
        const form = document.createElement("form");
        form.method = "POST";
        form.action = "https://signin.aws.amazon.com/saml";
        form.target = "_blank"; // Opens AWS Console in a new tab
      
        // SAML Response (Required)
        const inputSaml = document.createElement("input");
        inputSaml.type = "hidden";
        inputSaml.name = "SAMLResponse";
        inputSaml.value = samlResponseBase64;
      
        // RelayState (Optional, used to select role)
        const inputRelay = document.createElement("input");
        inputRelay.type = "hidden";
        inputRelay.name = "RelayState";
        inputRelay.value = relayState;
      
        form.appendChild(inputSaml);
        form.appendChild(inputRelay);
        document.body.appendChild(form);
        form.submit();
      
        // Remove form after submission
        document.body.removeChild(form);
      }     

}
