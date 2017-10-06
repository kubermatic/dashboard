import {Component, OnInit, EventEmitter, Output, Input, SimpleChanges} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {CustomValidators} from "ng2-validation";
import {ApiService} from "../../../api/api.service";
import {NodeInstanceFlavors} from "../../../api/model/NodeProviderConstants";
import {NodeCreateSpec} from "../../../api/entitiy/NodeEntity";
import {CreateNodeModel} from "../../../api/model/CreateNodeModel";
import {DigitaloceanNodeSpec} from "../../../api/entitiy/node/DigitialoceanNodeSpec";

@Component({
  selector: 'kubermatic-node-digitalocean',
  templateUrl: './digitalocean.component.html',
  styleUrls: ['./digitalocean.component.scss']
})
export class DigitaloceanNodeComponent implements OnInit {
  public doNodeForm: FormGroup;
  public nodeSize: any[] =  NodeInstanceFlavors.VOID;
  public nodeSpec: NodeCreateSpec;
  public nodeInstances: number;

  constructor(private formBuilder: FormBuilder,private api: ApiService) { }

  @Input() doToken: string;
  @Output() syncNodeModel = new EventEmitter();

  ngOnInit() {
    this.doNodeForm = this.formBuilder.group({
      node_count: [3, [<any>Validators.required, CustomValidators.min(1)]],
      node_size: ["", [<any>Validators.required]]
    });

    this.getNodeSize(this.doToken);
  }

  ngOnChanges(changes: SimpleChanges) {
    this.getNodeSize(changes.doToken.currentValue);
  }

  public getNodeSize(token: string) {
    if (token.length) {
      this.api.getDigitaloceanSizes(token).subscribe(result => {
          this.nodeSize = result.sizes;
        }
      );
    }
  }

  public onChange() {
    this.nodeSpec = new NodeCreateSpec(
      new DigitaloceanNodeSpec(this.doNodeForm.controls["node_size"].value),
      null,
      null,
      null,
    );
    this.nodeInstances = this.doNodeForm.controls["node_count"].value;

    if (this.doNodeForm.valid){
      const createNodeModel = new CreateNodeModel(this.nodeInstances, this.nodeSpec);
      this.syncNodeModel.emit(createNodeModel);
    }
  }

}
