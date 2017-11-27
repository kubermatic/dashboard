import {Component, OnInit, OnChanges, EventEmitter, Output, Input, SimpleChanges} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {CustomValidators} from "ng2-validation";
import {ApiService} from "app/core/services/api/api.service";
import {NodeInstanceFlavors} from "../../../../shared/model/NodeProviderConstants";
import {NodeCreateSpec} from "../../../../shared/entity/NodeEntity";
import {CreateNodeModel} from "../../../../shared/model/CreateNodeModel";
import {DigitaloceanNodeSpec} from "../../../../shared/entity/node/DigitialoceanNodeSpec";
import {InputValidationService} from '../../../../core/services';

@Component({
  selector: 'kubermatic-node-digitalocean',
  templateUrl: './digitalocean.component.html',
  styleUrls: ['./digitalocean.component.scss']
})
export class DigitaloceanNodeComponent implements OnInit, OnChanges {
  public doNodeForm: FormGroup;
  public nodeSize: any[] =  NodeInstanceFlavors.VOID;
  public nodeSpec: NodeCreateSpec;
  public nodeInstances: number;

  constructor(private formBuilder: FormBuilder,private api: ApiService, public inputValidationService: InputValidationService) { }

  @Input() node: CreateNodeModel;
  @Input() doToken: string;
  @Output() syncNodeModel = new EventEmitter();
  @Output() syncNodeSpecValid = new EventEmitter();

  ngOnInit() {
    this.doNodeForm = this.formBuilder.group({
      node_count: [this.node.instances, [<any>Validators.required, CustomValidators.min(1)]],
      node_size: [this.node.spec.digitalocean.size, [<any>Validators.required]]
    });

    this.getNodeSize(this.doToken);
  }

  ngOnChanges(changes: SimpleChanges) {
    this.getNodeSize(this.doToken);
  }

  public getNodeSize(token: string): void {
    if (token.length) {
      this.api.getDigitaloceanSizes(token).subscribe(result => {
          this.nodeSize = result.sizes;
          if (this.nodeSize.length > 0 && this.doNodeForm.controls["node_size"].value === '') {
            this.doNodeForm.patchValue({node_size: '4gb'});
            this.onChange();
          }
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
    const createNodeModel = new CreateNodeModel(this.nodeInstances, this.nodeSpec);
    this.syncNodeModel.emit(createNodeModel);
    this.syncNodeSpecValid.emit(this.doNodeForm.valid);
  }
}
