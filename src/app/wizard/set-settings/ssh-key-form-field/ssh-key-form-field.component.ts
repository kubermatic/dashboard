import { InputValidationService } from 'app/core/services/input-validation/input-validation.service';
import { Observable } from 'rxjs/Observable';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ApiService } from 'app/core/services/api/api.service';
import { SSHKeyEntity } from '../../../shared/entity/SSHKeyEntity';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AddSshKeyModalComponent } from '../../../shared/components/add-ssh-key-modal/add-ssh-key-modal.component';
import { MatDialog, MatDialogConfig, Sort } from '@angular/material';
import { select } from '@angular-redux/store/lib/src/decorators/select';
import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: 'kubermatic-ssh-key-form-field',
  templateUrl: './ssh-key-form-field.component.html',
  styleUrls: ['./ssh-key-form-field.component.scss']
})
export class SshKeyFormFieldComponent implements OnInit, OnDestroy {

  public sshKeys: SSHKeyEntity[] = [];
  public sortedData: SSHKeyEntity[] = [];
  public config: MatDialogConfig = {};
  public selectedCloudProviderApiError: string;
  public sshKeyForm: FormGroup;
  private subscriptions: Subscription[] = [];

  @select(['wizard', 'sshKeyForm', 'ssh_keys']) selectedSshKeys$: Observable<string[]>;
  public selectedSshKeys: string[] = [];

  @select(['wizard', 'setProviderForm', 'provider']) provider$: Observable<string>;
  public provider: string;

  @select(['wizard', 'isCheckedForm']) isChecked$: Observable<boolean>;

  constructor(private api: ApiService,
              private formBuilder: FormBuilder,
              public dialog: MatDialog,
              public inputValidationService: InputValidationService) { }

  ngOnInit() {
    const sub = this.selectedSshKeys$.subscribe(selectedSshKeys => {
      this.selectedSshKeys = selectedSshKeys;
    });
    this.subscriptions.push(sub);

    const subIsChecked = this.isChecked$.subscribe(isChecked => {
      isChecked && this.showRequiredFields();
    });
    this.subscriptions.push(subIsChecked);

    const subProvider = this.provider$.subscribe(provider => {
      provider && (this.provider = provider);
    });
    this.subscriptions.push(subProvider);

    this.sshKeyForm = this.formBuilder.group({
      ssh_keys: [this.selectedSshKeys, [Validators.required]]
    });

    this.sshKeyForm.updateValueAndValidity();

    if (this.provider !== 'bringyourown') {
      const subRefreshSSHKeys = this.refreshSSHKeys();
      this.subscriptions.push(subRefreshSSHKeys);
    }
  }

  public showRequiredFields() {
    if (this.sshKeyForm.invalid) {
      this.sshKeyForm.get('ssh_keys').markAsTouched();
    }
  }

  sortData(sort: Sort) {
    const data = this.sshKeys.slice();
    if (sort === null || !sort.active || sort.direction === '') {
      this.sortedData = data;
      return;
    }

    this.sortedData = data.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case 'name':
          return this.compare(a.spec.name, b.spec.name, isAsc);
        default:
          return 0;
      }
    });
  }

  compare(a, b, isAsc) {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  private refreshSSHKeys(): Subscription {
    return this.api.getSSHKeys().subscribe(result => {
      this.sshKeys = result;
      this.sortData({ active: 'name', direction: 'asc' });
      this.sshKeys = this.sortedData;
    });
  }

  public addSshKeyDialog(): void {
    const dialogRef = this.dialog.open(AddSshKeyModalComponent, this.config);

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.sshKeyForm.patchValue({ ssh_keys: [...this.selectedSshKeys, result.metadata.name] });
        this.refreshSSHKeys();
      }
    });
  }

  public ngOnDestroy(): void {
    this.subscriptions.forEach(sub => {
      sub.unsubscribe();
    });
  }

}
