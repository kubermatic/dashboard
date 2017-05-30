import { Component, OnInit, Input } from '@angular/core';
import { Router } from "@angular/router";
import { ApiService } from "../../api/api.service";
import { ClusterModel } from "../../api/model/ClusterModel";

@Component({
  selector: 'kubermatic-cluster-delete-confirmation',
  templateUrl: './cluster-delete-confirmation.component.html',
  styleUrls: ['./cluster-delete-confirmation.component.scss']
})
export class ClusterDeleteConfirmationComponent implements OnInit {

  @Input() humanReadableName: string;
  @Input() clusterName: string;
  @Input() seedDcName: string;

  public disableDeleteCluster: boolean = false;
  public clusterModel: ClusterModel;
  public cluster: any;

  constructor(private router: Router, private api: ApiService) {}

  ngOnInit() {

  }

  onChange(event: any) {
    if (event.target.value == this.humanReadableName && event.target.value.length ) {
      this.disableDeleteCluster = true;
    } else {
      this.disableDeleteCluster = false;
    }
  }

  deleteCluster(){
    this.clusterModel = new ClusterModel(this.seedDcName, this.clusterName);
    this.api.deleteCluster(this.clusterModel).subscribe(result => {
      this.cluster = result;
      this.router.navigate(['/clusters']);
    })
  }
}
