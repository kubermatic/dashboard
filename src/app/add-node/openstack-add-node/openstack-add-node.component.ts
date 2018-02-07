import { NgRedux } from '@angular-redux/store/lib/src/components/ng-redux';
import { NodeCreateSpec } from 'app/shared/entity/NodeEntity';
import { Validators, FormGroup, FormBuilder } from '@angular/forms';
import { Component, EventEmitter, OnInit, Output, Input, OnDestroy } from '@angular/core';
import { InputValidationService } from 'app/core/services';
import { CustomValidators } from 'ng2-validation';
import { NodeInstanceFlavors } from 'app/shared/model/NodeProviderConstants';
import { OpenstackNodeSpec } from 'app/shared/entity/node/OpenstackNodeSpec';
import { CreateNodeModel } from 'app/shared/model/CreateNodeModel';
import { select } from '@angular-redux/store';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: 'kubermatic-openstack-add-node',
  templateUrl: './openstack-add-node.component.html',
  styleUrls: ['./openstack-add-node.component.scss']
})
export class OpenstackAddNodeComponent implements OnInit, OnDestroy {

  @Output() public nodeSpecChanges: EventEmitter<{nodeSpec: NodeCreateSpec, count: number}> = new EventEmitter();
  @Output() public formChanges: EventEmitter<FormGroup> = new EventEmitter();
  @Input() public connect: string[] = [];

  public osNodeForm: FormGroup;
  public nodeSize: any[] =  NodeInstanceFlavors.Openstack;
  private subscriptions: Subscription[] = [];

  @select(['wizard', 'isCheckedForm']) isChecked$: Observable<boolean>;

  constructor(private fb: FormBuilder,
              public inputValidationService: InputValidationService,
              private ngRedux: NgRedux<any>) { }

  ngOnInit() {
    const sub = this.isChecked$.subscribe(isChecked => {
      isChecked && this.showRequiredFields();
    });
    this.subscriptions.push(sub);

    this.osNodeForm = this.fb.group({
      os_node_image: ['', [<any>Validators.required]],
      node_count: [1, [<any>Validators.required, CustomValidators.min(1)]],
      node_size: ['m1.medium', [<any>Validators.required]],
    });

    if (Array.isArray(this.connect) && this.connect.length) {
      const reduxStore = this.ngRedux.getState();
      const nodeForm = reduxStore.wizard.nodeForm;

      if (nodeForm) {
        const formValue = {
          os_node_image: nodeForm.os_node_image,
          node_count: nodeForm.node_count,
          node_size: nodeForm.node_size
        };

        this.osNodeForm.setValue(formValue);
      } else {
        this.osNodeForm.patchValue({node_count: 3});
      }
    }

    this.onChange();
  }

  public showRequiredFields() {
    if (this.osNodeForm.invalid) {
      for (const i in this.osNodeForm.controls) {
        if (this.osNodeForm.controls.hasOwnProperty(i)) {
          this.osNodeForm.get(i).markAsTouched();
        }
      }
    }
  }

  public onChange() {
    const nodeSpec = new NodeCreateSpec(
      null,
      null,
      new OpenstackNodeSpec(
        this.osNodeForm.controls['node_size'].value,
        this.osNodeForm.controls['os_node_image'].value
      ),
      null
    );

    this.nodeSpecChanges.emit({
      nodeSpec,
      count: this.osNodeForm.controls['node_count'].value
    });

    this.formChanges.emit(this.osNodeForm);
  }

  public ngOnDestroy(): void {
    this.subscriptions.forEach(sub => {
      sub.unsubscribe();
    });
  }

}
