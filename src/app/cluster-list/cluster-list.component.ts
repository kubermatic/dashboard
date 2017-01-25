import { Component, OnInit} from '@angular/core';
import {ApiService} from "../api/api.service";
import {ClusterEntity} from "../api/entitiy/ClusterEntity";

@Component({
  selector: 'kubermatic-cluster-list',
  templateUrl: './cluster-list.component.html',
  styleUrls: ['./cluster-list.component.scss']
})
export class ClusterListComponent implements OnInit {

  public clusters: ClusterEntity[] = [];

  constructor(private api: ApiService) { }

  ngOnInit() {
    this.api.getClusters().subscribe(result => {
      this.clusters = result;

      console.log('cluster', this.clusters);
    });
  }
}
