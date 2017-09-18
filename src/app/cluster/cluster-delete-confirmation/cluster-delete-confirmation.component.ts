
import { Component, OnInit, Input, DoCheck } from '@angular/core';
import { Store } from "@ngrx/store";
import * as fromRoot from "../../reducers/index";
import { RouterModule, Router } from "@angular/router";
import { ApiService } from "../../api/api.service";
import { ClusterModel } from "../../api/model/ClusterModel";
import { NotificationComponent } from "../../notification/notification.component";
import { MdDialogRef } from '@angular/material';

@Component({
  selector: 'kubermatic-cluster-delete-confirmation',
  templateUrl: './cluster-delete-confirmation.component.html',
  styleUrls: ['./cluster-delete-confirmation.component.scss']
})
export class ClusterDeleteConfirmationComponent implements OnInit, DoCheck {
  
  @Input() humanReadableName: string;
  @Input() clusterName: string;
  @Input() seedDcName: string;
  
  public disableDeleteCluster: boolean = false;
  public clusterModel: ClusterModel;
  public cluster: any;
  
  constructor(
    private router: Router,
    private api: ApiService, 
    private store: Store<fromRoot.State>,
    private dialogRef:MdDialogRef<ClusterDeleteConfirmationComponent>
  ) {}
  
  ngOnInit() {}
  
  ngDoCheck(): void {
    document.getElementById('name').focus();
  }

  onChange(event: any) {
    if (event.target.value == this.humanReadableName && event.target.value.length ) {
      this.disableDeleteCluster = true;
    } else {
      this.disableDeleteCluster = false;
    }
  }

  deleteCluster(){
    if(this.disableDeleteCluster == true) {
        this.dialogRef.close();
        this.clusterModel = new ClusterModel(this.seedDcName, this.clusterName);
        this.api.deleteCluster(this.clusterModel).subscribe(result => {
          this.cluster = result;
          NotificationComponent.success(this.store, "Success", `Cluster removed successfully`);
    
          this.router.navigate(['/clusters']);
        });
    }
  }
}
