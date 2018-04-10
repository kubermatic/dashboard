import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs/Subscription';
import { NodeInstanceFlavors } from '../../shared/model/NodeProviderConstants';
import { AddNodeService } from '../../core/services/add-node/add-node.service';
import { NodeProviderData } from '../../shared/model/NodeSpecChange';
import { CloudSpec } from '../../shared/entity/ClusterEntity';

@Component({
  selector: 'kubermatic-aws-add-node',
  templateUrl: './aws-add-node.component.html',
  styleUrls: ['./aws-add-node.component.scss']
})
export class AwsAddNodeComponent implements OnInit, OnDestroy {
  @Input() public cloudSpec: CloudSpec;
  public instanceTypes: string[] = NodeInstanceFlavors.AWS;
  public diskTypes: string[] = ['standard', 'gp2', 'io1', 'sc1', 'st1'];
  public awsNodeForm: FormGroup = new FormGroup({
    type: new FormControl('t2.small', Validators.required),
    disk_size: new FormControl(25, Validators.required),
    disk_type: new FormControl('standard', Validators.required),
    ami: new FormControl('')
  });
  public tagForm: FormGroup;
  public tagList: FormArray;
  private formOnChangeSub: Subscription[] = [];

  constructor(private addNodeService: AddNodeService, private fb: FormBuilder) {
  }

  ngOnInit(): void {
    this.tagForm = this.fb.group({
      tagList: this.fb.array([this.setTagList()])
    });

    this.formOnChangeSub.push(this.awsNodeForm.valueChanges.subscribe(data => {
      this.addNodeService.changeNodeProviderData(this.getNodeProviderData());
    }));

    this.formOnChangeSub.push(this.tagForm.valueChanges.subscribe(data => {
      this.addNodeService.changeNodeProviderData(this.getNodeProviderData());
    }));

    this.addNodeService.changeNodeProviderData(this.getNodeProviderData());
  }

  getNodeProviderData(): NodeProviderData {
    const tagMap = {};
    const tagListValue = this.tagForm.get('tagList').value;
    for (const i in tagListValue) {
      if (tagListValue[i].key !== '' && tagListValue[i].value !== '') {
        tagMap[tagListValue[i].key] = tagListValue[i].value;
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

  getTagForm(tagForm) {
    return tagForm.get('tagList').controls;
  }

  setTagList(): FormGroup {
    return this.fb.group({
      key: '',
      value: ''
    });
  }

  addTag() {
    this.tagList = <FormArray>this.tagForm.get('tagList');
    this.tagList.push(this.setTagList());
  }

  deleteTag(index: number): void {
    const arrayControl = <FormArray>this.tagForm.get('tagList');
    arrayControl.removeAt(index);
  }

  ngOnDestroy(): void {
    for (const sub of this.formOnChangeSub) {
      if (sub) {
        sub.unsubscribe();
      }
    }
  }
}
