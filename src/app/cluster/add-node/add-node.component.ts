import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { CustomValidators } from "ng2-validation";
import { ApiService } from "../../api/api.service";
import { ClusterModel } from "../../api/model/ClusterModel";
import { CreateNodeModel } from "../../api/model/CreateNodeModel";
import { NodeInstanceFlavors } from "../../api/model/NodeProviderConstants"

@Component({
  selector: 'kubermatic-add-node',
  templateUrl: './add-node.component.html',
  styleUrls: ['./add-node.component.scss']
})

export class AddNodeComponent implements OnInit {

  @Input() clusterName: string;
  @Input() seedDcName: string;
  @Input() nodeDcName: string;

  public addNodeForm: FormGroup;

  public clusterModel: ClusterModel;
  public createNodeModel: CreateNodeModel;
  public nodeProvider: string = 'digitalocean';
  public node: any;
  public nodeSpec: any = {spec: {}}
  public nodeInstances: number = 1;
  public nodeSizes: string[];

  constructor(private api: ApiService, private formBuilder: FormBuilder) { }

  ngOnInit() {
    this.getProviderNodeSpecification(this.nodeProvider);

    this.addNodeForm = this.formBuilder.group({
      node_count: [1, [<any>Validators.required, CustomValidators.min(1), CustomValidators.max(20)]],
      node_size: ['', [<any>Validators.required]]
    })

    this.nodeSpec.spec.dc = this.nodeDcName;
  }

  public getProviderNodeSpecification(provider) {
    switch (this.nodeProvider) {
      case 'aws' : {
        this.nodeSizes = NodeInstanceFlavors.AWS;
        return this.nodeSizes;
      }

      case 'digitalocean' : {
        //this.nodeSizes = NodeInstanceFlavors.digitalocean;
        return this.nodeSizes;
      }

      default : {
        break;
      }
    }
  }

  public setProviderNodeSpecification(provider): void {
    this.nodeInstances = this.addNodeForm.controls["node_count"].value;
    switch (this.nodeProvider) {
      case 'aws' : {
        this.nodeSpec.spec.aws = {
          type: this.addNodeForm.controls["node_size"].value
        };
        return;
      }

      case 'digitalocean' : {
        this.nodeSpec.spec.digitalocean = {
          type: this.addNodeForm.controls["node_size"].value
        };
        return;
      }

      default : {
        break;
      }
    }
  }

  public addNode(): void {
    this.setProviderNodeSpecification(this.nodeProvider);
    this.clusterModel = new ClusterModel(this.seedDcName, this.clusterName);
    this.createNodeModel = new CreateNodeModel(this.nodeInstances,this.nodeSpec.spec);

    this.api.createClusterNode(this.clusterModel, this.createNodeModel).subscribe(result => {
      this.node = result;
    })
  }
}
