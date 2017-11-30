import {Component, OnInit, Output, EventEmitter, Input} from '@angular/core';
import {Validators, FormBuilder, FormGroup} from "@angular/forms";
import {NodeInstanceFlavors} from "../../../../shared/model/NodeProviderConstants";
import {NodeCreateSpec} from "../../../../shared/entity/NodeEntity";
import {AWSNodeSpec} from "../../../../shared/entity/node/AWSNodeSpec";
import {CreateNodeModel} from "../../../../shared/model/CreateNodeModel";
import {InputValidationService} from '../../../../core/services';
import { WizardActions } from 'app/redux/actions/wizard.actions';
import { select } from '@angular-redux/store';
import { Observable } from 'rxjs/Rx';

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

  @select(['wizard', 'nodeModel']) nodeModel$: Observable<CreateNodeModel>;
  public nodeModel: CreateNodeModel;

  constructor(private formBuilder: FormBuilder, public inputValidationService: InputValidationService) { }

  ngOnInit() {
    this.nodeModel$.subscribe(nodeModel => {
      nodeModel && (this.nodeModel = nodeModel);
    });

    this.awsNodeForm = this.formBuilder.group({
      node_count: [this.nodeModel.instances, [<any>Validators.required, Validators.min(1)]],
      node_size: [this.nodeModel.spec.aws.instance_type, [<any>Validators.required]],
      root_size: [this.nodeModel.spec.aws.root_size, [Validators.required, Validators.min(10), Validators.max(16000)]],
      ami: [this.nodeModel.spec.aws.ami],
      aws_nas: [false]
    });
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


