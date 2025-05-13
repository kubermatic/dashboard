//                Kubermatic Enterprise Read-Only License
//                       Version 1.0 ("KERO-1.0”)
//                   Copyright © 2025 Kubermatic GmbH
//
// 1. You may only view, read and display for studying purposes the source
//    code of the software licensed under this license, and, to the extent
//    explicitly provided under this license, the binary code.
// 2. Any use of the software which exceeds the foregoing right, including,
//    without limitation, its execution, compilation, copying, modification
//    and distribution, is expressly prohibited.
// 3. THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND,
//    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
//    MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
//    IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
//    CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
//    TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
//    SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//
// END OF TERMS AND CONDITIONS

import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {KyvernoService} from '@app/core/services/kyverno';
import {NotificationService} from '@app/core/services/notification';
import {
  PolicyBinding,
  PolicyBindingSpec,
  PolicyTemplate,
  PolicyTemplateRef,
  Visibilities,
} from '@app/shared/entity/kyverno';
import {KUBERNETES_RESOURCE_NAME_PATTERN_VALIDATOR} from '@app/shared/validators/others';
import {Observable, Subject, takeUntil} from 'rxjs';

export interface AddPolicyBindingDialogConfig {
  projectID: string;
  clusterID: string;
  policyTemplates: PolicyTemplate[];
}

enum Controls {
  Name = 'name',
  Template = 'template',
  NamespaceSelectors = 'namespaceSelectors',
}

@Component({
  selector: 'km-add-policy-binding-dialog',
  templateUrl: './template.html',
  standalone: false,
})
export class AddPolicyBindingDialogComponent implements OnInit, OnDestroy {
  private readonly _unsubscribe = new Subject<void>();
  readonly controls = Controls;
  scopes = Object.values(Visibilities);
  form: FormGroup;
  projectID: string = this._config.projectID ?? '';
  clusterID: string = this._config.clusterID ?? '';
  policyTemplates: PolicyTemplate[] = this._config.policyTemplates;
  selectedTemplate: PolicyTemplate;
  selectorsLabels: Record<string, string> = {};

  constructor(
    private readonly _dialogRef: MatDialogRef<AddPolicyBindingDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private readonly _config: AddPolicyBindingDialogConfig,
    private readonly _builder: FormBuilder,
    private _kyvernoService: KyvernoService,
    private readonly _notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this._initForm();
    this.form
      .get(Controls.Template)
      .valueChanges.pipe(takeUntil(this._unsubscribe))
      .subscribe((templateName: string) => {
        this.selectedTemplate = this.policyTemplates.find((template: PolicyTemplate) => template.name === templateName);
      });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getObservable(): Observable<PolicyBinding> {
    return this._kyvernoService.createPolicyBinding(this._getPolicyBindingObject(), this.projectID, this.clusterID);
  }

  onNext(binding: PolicyBinding): void {
    this._dialogRef.close(binding);
    this._notificationService.success(`Created policy binding ${binding.name}`);
  }

  private _initForm(): void {
    this.form = this._builder.group({
      [Controls.Name]: this._builder.control('', [Validators.required, KUBERNETES_RESOURCE_NAME_PATTERN_VALIDATOR]),
      [Controls.Template]: this._builder.control('', Validators.required),
      [Controls.NamespaceSelectors]: this._builder.control(false),
    });
  }

  private _getPolicyBindingObject(): PolicyBinding {
    const policyBinding = {
      name: this.form.get(Controls.Name).value,
      spec: {
        policyTemplateRef: {
          name: this.form.get(Controls.Template).value,
        } as PolicyTemplateRef,
        namespaceSelector: this.form.get(Controls.NamespaceSelectors).value,
      } as PolicyBindingSpec,
    } as PolicyBinding;

    if (this.projectID) {
      policyBinding.projectID = this.projectID;
    }
    return policyBinding;
  }
}
