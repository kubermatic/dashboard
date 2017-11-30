import {Component, OnInit, Output, EventEmitter, Input} from '@angular/core';
import {Validators, FormBuilder, FormGroup} from "@angular/forms";
import {NodeInstanceFlavors} from "../../../../shared/model/NodeProviderConstants";
import {NodeCreateSpec} from "../../../../shared/entity/NodeEntity";
import {AWSNodeSpec} from "../../../../shared/entity/node/AWSNodeSpec";
import {CreateNodeModel} from "../../../../shared/model/CreateNodeModel";
import {InputValidationService} from '../../../../core/services';

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

  constructor(private formBuilder: FormBuilder, public inputValidationService: InputValidationService) { }

  @Input() node: CreateNodeModel;
  @Output() syncNodeModel = new EventEmitter();

  ngOnInit() {
    this.awsNodeForm = this.formBuilder.group({
      node_count: [this.node.instances, [<any>Validators.required, Validators.min(1)]],
      node_size: [this.node.spec.aws.instance_type, [<any>Validators.required]],
      root_size: [this.node.spec.aws.root_size, [Validators.required, Validators.min(10), Validators.max(16000)]],
      ami: [this.node.spec.aws.ami],
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
    this.nodeInstances = this.awsNodeForm.controls["node_count"].value;

    const createNodeModel = new CreateNodeModel(this.nodeInstances, this.nodeSpec);
    this.syncNodeModel.emit(createNodeModel);
  }
}


