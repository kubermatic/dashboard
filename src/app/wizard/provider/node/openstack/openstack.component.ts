import { WizardActions } from 'app/redux/actions/wizard.actions';
import {Component, OnInit, Output, EventEmitter, Input} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {NodeInstanceFlavors} from "../../../../shared/model/NodeProviderConstants";
import {CustomValidators} from "ng2-validation";
import {NodeCreateSpec} from "../../../../shared/entity/NodeEntity";
import {OpenstackNodeSpec} from "../../../../shared/entity/node/OpenstackNodeSpec";
import {CreateNodeModel} from "../../../../shared/model/CreateNodeModel";
import { select } from '@angular-redux/store';
import { Observable } from 'rxjs/Rx';
import {InputValidationService} from '../../../../core/services';

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

  @select(['wizard', 'nodeModel']) nodeModel$: Observable<CreateNodeModel>;
  public nodeModel: CreateNodeModel;

  constructor(private formBuilder: FormBuilder, public inputValidationService: InputValidationService) { }

  ngOnInit() {
    this.nodeModel$.subscribe(nodeModel => {
      nodeModel && (this.nodeModel = nodeModel);
    });

    this.osNodeForm = this.formBuilder.group({
      os_node_image: [this.nodeModel.spec.openstack.image, [<any>Validators.required]],
      node_count: [this.nodeModel.instances, [<any>Validators.required, CustomValidators.min(1)]],
      node_size: [this.nodeModel.spec.openstack.flavor, [<any>Validators.required]],
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
    WizardActions.setNodeSpec(this.nodeSpec);

    this.nodeInstances = this.osNodeForm.controls["node_count"].value;
    const createNodeModel = new CreateNodeModel(this.nodeInstances, this.nodeSpec);
    WizardActions.setNodeModel(createNodeModel);
  }
}
