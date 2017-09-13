import { Injectable } from '@angular/core';

@Injectable()
export class LocalStorageService {

  constructor() { }

  public setNodesCreationData(nodesCreationData): void {
    localStorage.setItem('createNodesStatus', 'yes');
    localStorage.setItem('no-reload', 'yes');
    localStorage.setItem('nodesCreationData', JSON.stringify(nodesCreationData));
  }

  public setPageReloaded() {
    localStorage.removeItem('no-reload');    
  }

  public removeNodesCreationData() {
    localStorage.removeItem('nodesCreationData');
    localStorage.removeItem('createNodesStatus');
    localStorage.removeItem('no-reload');
  }

  public getNodesData(clusterName: string): any {
    let noReload = localStorage.getItem('no-reload');
    let nodeCreationStatus = localStorage.getItem('createNodesStatus');
    let createNodesData = JSON.parse(localStorage.getItem('nodesCreationData'));

    return (!noReload && nodeCreationStatus 
      && createNodesData.cluster.metadata.name == clusterName) ? createNodesData : null;
  }
}
