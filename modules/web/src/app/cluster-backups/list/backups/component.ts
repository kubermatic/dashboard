import { Component } from '@angular/core';

@Component({
  selector: 'km-cluster-backups-list',
  templateUrl: './template.html',
})
export class ClustersBackupsListComponent {

  get columns(): string[] {
    return ['name', 'cluster', 'destination', 'schedule', 'keep', 'created', 'actions'];
  }

  get canAdd(): boolean {
    return true
  }
  constructor() {}
  add(): void {}
}
