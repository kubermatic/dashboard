import {Component, OnInit, Output, EventEmitter} from '@angular/core';
import {Validators, FormBuilder, FormGroup} from "@angular/forms";
import {NodeInstanceFlavors} from "../../../api/model/NodeProviderConstants";

@Component({
  selector: 'kubermatic-node-aws',
  templateUrl: './aws.component.html',
  styleUrls: ['./aws.component.scss']
})
export class AwsNodeComponent implements OnInit {

  constructor(private formBuilder: FormBuilder) { }

  @Output() syncNodeSpec = new EventEmitter();

  public nodeSize: any[] =  NodeInstanceFlavors.AWS;
  public awsNodeForm: FormGroup;

  ngOnInit() {
    this.awsNodeForm = this.formBuilder.group({
      node_count: [3, [<any>Validators.required, Validators.min(1)]],
      node_size: ["", [<any>Validators.required]],
      root_size: [20, [Validators.required, Validators.min(10), Validators.max(16000)]],
      ami: [""],

    });
  }

}
