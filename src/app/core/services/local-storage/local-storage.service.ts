import { Injectable } from '@angular/core';

@Injectable()
export class LocalStorageService {

  constructor() { }

  public setNodesCreationData(nodesCreationData): void {
    localStorage.setItem('nodesCreationData', JSON.stringify(nodesCreationData));
  }

  public removeNodesCreationData() {
    localStorage.removeItem('nodesCreationData');
  }

  public getNodesData(): any {
    return JSON.parse(localStorage.getItem('nodesCreationData'));
  }
}
