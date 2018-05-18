import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs/Subscription';
import { NodeInstanceFlavors } from '../../shared/model/NodeProviderConstants';
import { AddNodeService } from '../../core/services/add-node/add-node.service';
import { NodeData, NodeProviderData } from '../../shared/model/NodeSpecChange';
import { CloudSpec } from '../../shared/entity/ClusterEntity';

@Component({
  selector: 'kubermatic-aws-add-node',
  templateUrl: './aws-add-node.component.html',
  styleUrls: ['./aws-add-node.component.scss']
})
export class AwsAddNodeComponent implements OnInit, OnDestroy {
  @Input() public cloudSpec: CloudSpec;
  @Input() public nodeData: NodeData;
  public instanceTypes: string[] = NodeInstanceFlavors.AWS;
  public diskTypes: string[] = ['standard', 'gp2', 'io1', 'sc1', 'st1'];
  public awsNodeForm: FormGroup;
  public tags: FormArray;
  private formOnChangeSub: Subscription;

  constructor(private addNodeService: AddNodeService) {
  }

  ngOnInit(): void {
    this.awsNodeForm = new FormGroup({
      type: new FormControl(this.nodeData.node.spec.cloud.aws.instanceType, Validators.required),
      disk_size: new FormControl(this.nodeData.node.spec.cloud.aws.diskSize, Validators.required),
      disk_type: new FormControl(this.nodeData.node.spec.cloud.aws.volumeType, Validators.required),
      ami: new FormControl(this.nodeData.node.spec.cloud.aws.ami),
      tags: new FormArray([
        new FormGroup({
          key: new FormControl(''),
          value: new FormControl('')
        })
      ])
    });

    this.formOnChangeSub = this.awsNodeForm.valueChanges.subscribe(data => {
      this.addNodeService.changeNodeProviderData(this.getNodeProviderData());
    });

    this.addNodeService.changeNodeProviderData(this.getNodeProviderData());
  }

  getNodeProviderData(): NodeProviderData {
    const tagMap = {};
    for (const i in this.awsNodeForm.controls.tags.value) {
      if (this.awsNodeForm.controls.tags.value[i].key !== '' && this.awsNodeForm.controls.tags.value[i].value !== '') {
        tagMap[this.awsNodeForm.controls.tags.value[i].key] = this.awsNodeForm.controls.tags.value[i].value;
      }
    }

    return {
      spec: {
        aws: {
          instanceType: this.awsNodeForm.controls.type.value,
          diskSize: this.awsNodeForm.controls.disk_size.value,
          ami: this.awsNodeForm.controls.ami.value,
          tags: tagMap,
          volumeType: this.awsNodeForm.controls.disk_type.value,
        },
      },
      valid: this.awsNodeForm.valid,
    };
  }

  getTagForm(form) {
    return form.get('tags').controls;
  }

  addTag() {
    this.tags = <FormArray>this.awsNodeForm.get('tags');
    this.tags.push(new FormGroup({
      key: new FormControl(''),
      value: new FormControl('')
    }));
  }

  deleteTag(index: number): void {
    const arrayControl = <FormArray>this.awsNodeForm.get('tags');
    arrayControl.removeAt(index);
  }

  ngOnDestroy(): void {
    this.formOnChangeSub.unsubscribe();
  }
}
