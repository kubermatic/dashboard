import { NgRedux } from '@angular-redux/store/lib/src/components/ng-redux';
import {Component, OnInit } from '@angular/core';
import { Validators, FormBuilder, FormGroup } from "@angular/forms";
import { NodeInstanceFlavors } from "../../../../shared/model/NodeProviderConstants";
import { NodeCreateSpec } from "../../../../shared/entity/NodeEntity";
import { AWSNodeSpec } from "../../../../shared/entity/node/AWSNodeSpec";
import { CreateNodeModel } from "../../../../shared/model/CreateNodeModel";
import { WizardActions } from 'app/redux/actions/wizard.actions';

@Component({
  selector: 'kubermatic-node-aws',
  templateUrl: './aws.component.html',
  styleUrls: ['./aws.component.scss']
})
export class AwsNodeComponent implements OnInit {
  public awsNodeForm: FormGroup;
  public nodeSize: any[] = NodeInstanceFlavors.AWS;
  public nodeSpec: NodeCreateSpec;
  public nodeInstances: number;

  constructor(private formBuilder: FormBuilder,
              private ngRedux: NgRedux<any>) { }

  ngOnInit() {
    const reduxStore = this.ngRedux.getState();
    const nodeForm = reduxStore.wizard.awsNodeForm;

    this.awsNodeForm = this.formBuilder.group({
      node_count: [nodeForm.node_count, [<any>Validators.required, Validators.min(1)]],
      node_size: [nodeForm.node_size, [<any>Validators.required]],
      root_size: [nodeForm.root_size, [Validators.required, Validators.min(10), Validators.max(16000)]],
      ami: [nodeForm.ami],
      aws_nas: [nodeForm.aws_nas]
    });

    WizardActions.setValidation('awsNodeForm', this.awsNodeForm.valid);
  }

  public onChange() {
    this.nodeSpec = new NodeCreateSpec(
      null,
      new AWSNodeSpec(
        this.awsNodeForm.controls["node_size"].value,
        this.awsNodeForm.controls["root_size"].value,
        // Can we implement at some point
        // this.awsForm.controls["volume_type"].value,
        "gp2",
        this.awsNodeForm.controls["ami"].value
      ),
      null,
      null,
    );
    WizardActions.setNodeSpec(this.nodeSpec);

    this.nodeInstances = this.awsNodeForm.controls["node_count"].value;
    const createNodeModel = new CreateNodeModel(this.nodeInstances, this.nodeSpec);

    WizardActions.setNodeModel(createNodeModel);
  }
}


