import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { View } from '@app/shared/entity/common';

@Component({
  selector: 'km-cluster-backups',
  templateUrl: './template.html',
})
export class ClusterBackupsComponent implements OnInit{
  readonly view = View;
  clustersBackupView: string;

  constructor(private _router: Router) {}

  ngOnInit(): void {
    this.getClusterBackupsView();
  }

  getClusterBackupsView(): void {
    const urlArray = this._router.routerState.snapshot.url.split('/');
    this.clustersBackupView = urlArray[urlArray.length - 1];
  }

}
