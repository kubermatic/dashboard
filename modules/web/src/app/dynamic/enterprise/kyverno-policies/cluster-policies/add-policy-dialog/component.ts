import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {KyvernoService} from '@app/core/services/kyverno';
import {NotificationService} from '@app/core/services/notification';
import {PolicyBinding, PolicyBindingSpec, PolicyTemplate} from '@app/shared/entity/kyverno';
import {Observable, Subject, takeUntil} from 'rxjs';

export interface AddPolicyDialogConfig {
  projectID: string;
  clusterID: string;
  templates: PolicyTemplate[];
  namespaces: string[];
}

enum Controls {
  Template = 'template',
  Namespace = 'namespace',
}

@Component({
  selector: 'km-add-policy-dialog',
  templateUrl: './template.html',
  standalone: false,
})
export class AddPolicyDialogComponent implements OnInit, OnDestroy {
  private readonly _unsubscribe = new Subject<void>();
  form: FormGroup;
  controls = Controls;
  selectedTemplate: PolicyTemplate;
  templates: PolicyTemplate[] = this._config.templates;
  namespaces: string[] = this._config.namespaces;
  templateLabel = this._config.templates?.length ? 'Policy Template' : 'No Policy Templates Available';

  constructor(
    @Inject(MAT_DIALOG_DATA) private readonly _config: AddPolicyDialogConfig,
    private readonly _dialogRef: MatDialogRef<AddPolicyDialogComponent>,
    private readonly _builder: FormBuilder,
    private readonly _kyvernoService: KyvernoService,
    private readonly _notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Template]: this._builder.control('', Validators.required),
      [Controls.Namespace]: this._builder.control(''),
    });

    this.form
      .get(Controls.Template)
      .valueChanges.pipe(takeUntil(this._unsubscribe))
      .subscribe((template: PolicyTemplate) => {
        this.selectedTemplate = template;
        if (template.spec?.namespacedPolicy) {
          this.form.get(Controls.Namespace).addValidators(Validators.required);
        } else {
          this.form.get(Controls.Namespace).clearValidators();
        }
        this.form.get(Controls.Namespace).updateValueAndValidity();
      });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getObservable(): Observable<PolicyBinding> {
    return this._kyvernoService.createPolicyBinding(
      this._getPolicyBindingObject(),
      this._config.projectID,
      this._config.clusterID
    );
  }

  onNext(binding: PolicyBinding): void {
    this._dialogRef.close(binding);
    this._notificationService.success(`Create the ${binding.name} policy`);
  }

  private _getPolicyBindingObject(): PolicyBinding {
    const newBinding: PolicyBinding = {
      name: this.form.get(Controls.Template).value.name,
      spec: {
        policyTemplateRef: {
          name: this.form.get(Controls.Template).value.name,
        },
      } as PolicyBindingSpec,
    };

    if (this.selectedTemplate?.spec?.namespacedPolicy) {
      newBinding.spec.kyvernoPolicyNamespace = {
        name: this.form.get(Controls.Namespace).value.main,
      };
    }

    return newBinding;
  }
}
