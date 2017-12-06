import { CreateNodeModel } from 'app/shared/model/CreateNodeModel';
import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NodeCreateSpec } from './../../shared/entity/NodeEntity';
import { NodeInstanceFlavors } from 'app/shared/model/NodeProviderConstants';
import { AWSNodeSpec } from 'app/shared/entity/node/AWSNodeSpec';

@Component({
  selector: 'kubermatic-aws-add-node',
  templateUrl: './aws-add-node.component.html',
  styleUrls: ['./aws-add-node.component.scss']
})
export class AwsAddNodeComponent implements OnInit {
  @Output() public nodeSpecChanges: EventEmitter<{nodeSpec: NodeCreateSpec, count: number}> = new EventEmitter();  
  @Output() public formChanges: EventEmitter<FormGroup> = new EventEmitter();
  
  public awsNodeForm: FormGroup;  
  public nodeSize: any[] = NodeInstanceFlavors.AWS;  
  public nodeSpec: NodeCreateSpec;
  
  constructor(private fb: FormBuilder) { }

  ngOnInit() {
    this.awsNodeForm = this.fb.group({
      node_count: [1, [<any>Validators.required, Validators.min(1)]],
      node_size: ['t2.medium', [<any>Validators.required]],
      root_size: [20, [Validators.required, Validators.min(10), Validators.max(16000)]],
      ami: [''],
      aws_nas: [false]
    });

    this.formChanges.emit(this.awsNodeForm);
  }

  public onChange() {
    const nodeSpec = new NodeCreateSpec(
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
      null
    );

    this.nodeSpecChanges.emit({
      nodeSpec,
      count: this.awsNodeForm.controls["node_count"].value
    });

    this.formChanges.emit(this.awsNodeForm);

    const createNodeModel = new CreateNodeModel(
      this.awsNodeForm.controls["node_count"].value, 
      nodeSpec
    );
  }

}
