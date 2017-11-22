import {Component, OnInit, Output, EventEmitter, Input} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {NodeInstanceFlavors} from "../../../shared/model/NodeProviderConstants";
import {CustomValidators} from "ng2-validation";
import {NodeCreateSpec} from "../../../shared/entity/NodeEntity";
import {OpenstackNodeSpec} from "../../../shared/entity/node/OpenstackNodeSpec";
import {CreateNodeModel} from "../../../shared/model/CreateNodeModel";

import {InputValidationService} from '../../../core/services';

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

  constructor(private formBuilder: FormBuilder, public inputValidationService: InputValidationService) { }

  @Input() node: CreateNodeModel;
  @Output() syncNodeModel = new EventEmitter();
  @Output() syncNodeSpecValid = new EventEmitter();

  ngOnInit() {
    this.osNodeForm = this.formBuilder.group({
      os_node_image: [this.node.spec.openstack.image, [<any>Validators.required]],
      node_count: [this.node.instances, [<any>Validators.required, CustomValidators.min(1)]],
      node_size: [this.node.spec.openstack.flavor, [<any>Validators.required]],
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

    const createNodeModel = new CreateNodeModel(this.nodeInstances, this.nodeSpec);
    this.syncNodeModel.emit(createNodeModel);
    this.syncNodeSpecValid.emit(this.osNodeForm.valid);
  }
}
