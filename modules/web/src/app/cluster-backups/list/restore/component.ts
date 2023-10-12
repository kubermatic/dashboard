import { Component } from '@angular/core';

@Component({
  selector: 'km-cluster-restore-list',
  templateUrl: './template.html',
})
export class ClustersRestoresListComponent {

  get columns(): string[] {
    return ['name', 'phase', 'clusterID', 'backupName', 'destination', 'actions'];
  }

  get canAdd(): boolean {
    return true
  }
  constructor() {}
  add(): void {}
}
