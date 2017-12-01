import { NgRedux } from '@angular-redux/store/lib/src/components/ng-redux';
import { WizardActions } from 'app/redux/actions/wizard.actions';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { NodeInstanceFlavors } from "../../../../shared/model/NodeProviderConstants";
import { CustomValidators } from "ng2-validation";
import { NodeCreateSpec } from "../../../../shared/entity/NodeEntity";
import { OpenstackNodeSpec } from "../../../../shared/entity/node/OpenstackNodeSpec";
import { CreateNodeModel } from "../../../../shared/model/CreateNodeModel";
import { select } from '@angular-redux/store';
import { Observable } from 'rxjs/Rx';
import { InputValidationService } from '../../../../core/services';

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

  constructor(private formBuilder: FormBuilder, 
              public inputValidationService: InputValidationService,
              private ngRedux: NgRedux<any>) { }

  ngOnInit() {
    this.nodeModel$.subscribe(nodeModel => {
      nodeModel && (this.nodeModel = nodeModel);
    });

    const reduxStore = this.ngRedux.getState();
    const nodeForm = reduxStore.wizard.openstackNodeForm;

    this.osNodeForm = this.formBuilder.group({
      os_node_image: [nodeForm.os_node_image, [<any>Validators.required]],
      node_count: [nodeForm.node_count, [<any>Validators.required, CustomValidators.min(1)]],
      node_size: [nodeForm.node_size, [<any>Validators.required]],
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
