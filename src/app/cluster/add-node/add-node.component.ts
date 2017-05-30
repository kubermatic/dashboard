import {Component, OnInit, Input, Output, EventEmitter} from "@angular/core";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {CustomValidators} from "ng2-validation";
import {ApiService} from "../../api/api.service";
import {ClusterModel} from "../../api/model/ClusterModel";
import {CreateNodeModel} from "../../api/model/CreateNodeModel";
import {NodeInstanceFlavors} from "../../api/model/NodeProviderConstants";

import {NotificationComponent} from "../../notification/notification.component";
import {Store} from "@ngrx/store";
import * as fromRoot from "../../reducers/index";

@Component({
  selector: 'kubermatic-add-node',
  templateUrl: './add-node.component.html',
  styleUrls: ['./add-node.component.scss']
})

export class AddNodeComponent implements OnInit {
  @Input() cluster: any;
  @Input() clusterName: string;
  @Input() seedDcName: string;
  @Input() nodeProvider: string;

  @Output() syncNodes = new EventEmitter();

  public addNodeForm: FormGroup;
  public clusterModel: ClusterModel;
  public createNodeModel: CreateNodeModel;
  public nodeDcName: string;
  public node: any;
  public nodeSpec: any = {spec: {}}
  public nodeInstances: number = 1;
  public nodeSizes: any = [];
  public sshKeys: any;


  constructor(private api: ApiService, private formBuilder: FormBuilder, private store: Store<fromRoot.State>) { }

  ngOnInit() {

    this.nodeDcName = this.cluster.spec.cloud.dc;
    this.nodeProvider = this.cluster.dc.spec.provider;
    this.nodeSpec.spec.dc = this.cluster.spec.cloud.dc;

    this.getProviderNodeSpecification();

    this.addNodeForm = this.formBuilder.group({
      node_count: [1, [<any>Validators.required, CustomValidators.min(1), CustomValidators.max(20)]],
      node_size: ['', [<any>Validators.required]],
      disk_size: [8, [<any>Validators.required, CustomValidators.min(8), CustomValidators.max(200)]],
      container_linux_version: ['']
    });
  }

  public addValidForm () {
    if (this.nodeProvider == 'baremetal') {
      return true;
    }
    return this.addNodeForm.valid;
  }

  public getProviderNodeSpecification() {
    switch (this.nodeProvider) {
      case 'aws' : {
        this.nodeSizes = NodeInstanceFlavors.AWS;
        return this.nodeSizes;
      }

      case 'digitalocean' : {
        this.api.getDigitaloceanSizes(this.cluster.spec.cloud.digitalocean.token).subscribe(result => {
            this.nodeSizes = result.sizes;
            return this.nodeSizes;
          }
        );
      }
    }
  }


  public setProviderNodeSpecification(): void {
    this.nodeInstances = this.addNodeForm.controls["node_count"].value;
    switch (this.nodeProvider) {
      case 'aws' : {
        this.nodeSpec.spec.aws = {
          type: this.addNodeForm.controls["node_size"].value,
          disk_size: this.addNodeForm.controls["disk_size"].value,
          container_linux: {
            version: this.addNodeForm.controls["container_linux_version"].value
          }
        };
        return;
      }

      case 'digitalocean' : {
        this.nodeSpec.spec.digitalocean = {
          sshKeys: this.cluster.spec.cloud.digitalocean.sshKeys,
          size: this.addNodeForm.controls["node_size"].value
        };
        return;
      }

      case 'baremetal' : {
        this.nodeSpec.spec.baremetal = {};
        return;

      }

      default : {
        break;
      }
    }
  }

  public addNode(): void {
    this.setProviderNodeSpecification();
    this.clusterModel = new ClusterModel(this.seedDcName, this.clusterName);
    this.createNodeModel = new CreateNodeModel(this.nodeInstances,this.nodeSpec.spec);

    this.api.createClusterNode(this.clusterModel, this.createNodeModel).subscribe(result => {
      NotificationComponent.success(this.store, "Success", `Node(s) successfully created`);
      this.node = result;
      this.node.push(result);
      this.syncNodes.emit(this.node);
    },
      error => {
        NotificationComponent.error(this.store, "Error", `${error.status} ${error.statusText}`);
      });
  }
}
