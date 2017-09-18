import {Component, OnInit, Output, EventEmitter} from '@angular/core';
import {Validators, FormBuilder, FormGroup} from "@angular/forms";
import {NodeInstanceFlavors} from "../../../api/model/NodeProviderConstants";
import {NodeCreateSpec} from "../../../api/entitiy/NodeEntity";
import {AWSNodeSpec} from "../../../api/entitiy/node/AWSNodeSpec";
import {CreateNodeModel} from "../../../api/model/CreateNodeModel";

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

  constructor(private formBuilder: FormBuilder) { }

  @Output() syncNodeModel = new EventEmitter();

  ngOnInit() {
    this.awsNodeForm = this.formBuilder.group({
      node_count: [3, [<any>Validators.required, Validators.min(1)]],
      node_size: ["", [<any>Validators.required]],
      root_size: [20, [Validators.required, Validators.min(10), Validators.max(16000)]],
      ami: [""],
    });
  }

  public onChange() {
    this.nodeSpec = new NodeCreateSpec(
      null,
      new AWSNodeSpec(
        this.awsNodeForm.controls["node_size"].value,
        this.awsNodeForm.controls["root_size"].value,
        //Can we implement at some point
        // this.awsForm.controls["volume_type"].value,
        "gp2",
        this.awsNodeForm.controls["ami"].value
      ),
      null,
      null,
    );
    this.nodeInstances = this.awsNodeForm.controls["node_count"].value;

    if (this.awsNodeForm.valid){
      const createNodeModel = new CreateNodeModel(this.nodeInstances, this.nodeSpec);
      this.syncNodeModel.emit(createNodeModel);
    }
  }
}


