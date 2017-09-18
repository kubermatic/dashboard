import {Component, OnInit, Output, EventEmitter} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {NodeInstanceFlavors} from "../../../api/model/NodeProviderConstants";
import {CustomValidators} from "ng2-validation";
import {NodeCreateSpec} from "../../../api/entitiy/NodeEntity";
import {OpenstackNodeSpec} from "../../../api/entitiy/node/OpenstackNodeSpec";
import {CreateNodeModel} from "../../../api/model/CreateNodeModel";

@Component({
  selector: 'kubermatic-node-openstack',
  templateUrl: './openstack.component.html',
  styleUrls: ['./openstack.component.scss']
})
export class OpenstackNodeComponent implements OnInit {
  public osNodeForm: FormGroup;
  public nodeSize: any[] =  NodeInstanceFlavors.Openstack;
  public nodeSpec: NodeCreateSpec;
  public nodeInstances: number;

  constructor(private formBuilder: FormBuilder) { }

  @Output() syncNodeModel = new EventEmitter();

  ngOnInit() {
    this.osNodeForm = this.formBuilder.group({
      os_node_image: ["", [<any>Validators.required]],
      node_count: [3, [<any>Validators.required, CustomValidators.min(1)]],
      node_size: ["", [<any>Validators.required]],
    });
  }

  public onChange() {
    this.nodeSpec = new NodeCreateSpec(
      null,
      null,
      new OpenstackNodeSpec(
        this.osNodeForm.controls["node_size"].value,
        this.osNodeForm.controls["os_node_image"].value
      ),
      null,
    );
    this.nodeInstances = this.osNodeForm.controls["node_count"].value;

    if (this.osNodeForm.valid){
      const createNodeModel = new CreateNodeModel(this.nodeInstances, this.nodeSpec);
      this.syncNodeModel.emit(createNodeModel);
    }
  }
}
