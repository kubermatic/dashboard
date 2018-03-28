import { NodeInstanceFlavors } from '../../shared/model/NodeProviderConstants';
import { Input, EventEmitter, Output, OnDestroy, OnInit, Component } from '@angular/core';
import { CustomValidators } from 'ng2-validation';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { NodeCreateSpec, NodeCloudSpec, OperatingSystemSpec, NodeVersionInfo, UbuntuSpec, NodeContainerRuntimeInfo } from '../../shared/entity/NodeEntity';
import { InputValidationService } from '../../core/services/input-validation/input-validation.service';
import { WizardActions } from '../../redux/actions/wizard.actions';
import { select } from '@angular-redux/store';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { HetznerNodeSpec } from '../../shared/entity/node/HetznerNodeSpec';

@Component({
  selector: 'kubermatic-hetzner-add-node',
  templateUrl: './hetzner-add-node.component.html',
  styleUrls: ['./hetzner-add-node.component.scss']
})

export class HetznerAddNodeComponent implements OnInit, OnDestroy {

  @Input() public token: string = '';
  @Input() public connect: string[] = [];
  @Output() public nodeSpecChanges: EventEmitter<{nodeSpec: NodeCreateSpec}> = new EventEmitter();
  @Output() public formChanges: EventEmitter<FormGroup> = new EventEmitter();

  public hetznerNodeForm: FormGroup;
  public nodeSize: any[] = NodeInstanceFlavors.Hetzner;
  private subscriptions: Subscription[] = [];

  @select(['wizard', 'isCheckedForm']) isChecked$: Observable<boolean>;

  @select(['wizard', 'nodeForm']) nodeForm$: Observable<any>;
  public nodeForm: any;

  constructor(private fb: FormBuilder,
              public inputValidationService: InputValidationService) { }

  ngOnInit() {
    const subIsChecked = this.isChecked$.subscribe(isChecked => {
      isChecked && this.showRequiredFields();
    });
    this.subscriptions.push(subIsChecked);

    const subNodeForm = this.nodeForm$.subscribe(nodeForm => {
      nodeForm && (this.nodeForm = nodeForm);
    });
    this.subscriptions.push(subNodeForm);

    this.hetznerNodeForm = this.fb.group({
      node_count: [3, [<any>Validators.required, CustomValidators.min(1)]],
      node_size: ['cx41', [<any>Validators.required]]
    });

    if (this.nodeForm) {
      const formValue = {
        node_count: this.nodeForm.node_count,
        node_size: this.nodeForm.node_size
      };
      this.hetznerNodeForm.setValue(formValue);
    }

    this.onChange();
  }

  public showRequiredFields() {
    if (this.hetznerNodeForm.invalid) {
      for (const i in this.hetznerNodeForm.controls) {
        if (this.hetznerNodeForm.controls.hasOwnProperty(i)) {
          this.hetznerNodeForm.get(i).markAsTouched();
        }
      }
    }
  }

  public onChange() {
    WizardActions.formChanged(
      ['wizard', 'nodeForm'],
      {
        node_size: this.hetznerNodeForm.controls['node_size'].value,
        node_count: this.hetznerNodeForm.controls['node_count'].value,
      },
      this.hetznerNodeForm.valid
    );

    if (this.nodeForm) {
      const nodeSpec = new NodeCreateSpec(
        new NodeCloudSpec(
          null,
          null,
          null,
          new HetznerNodeSpec(
            this.nodeForm.node_size,
          ),
        ),
        new OperatingSystemSpec(
          new UbuntuSpec(false),
          null
        ),
        new NodeVersionInfo(
          '',
          new NodeContainerRuntimeInfo('', '')
        )
      );

      this.nodeSpecChanges.emit({
        nodeSpec
      });
    }
    this.formChanges.emit(this.hetznerNodeForm);
  }

  public ngOnDestroy(): void {
    this.subscriptions.forEach(sub => {
      sub.unsubscribe();
    });
  }
}
