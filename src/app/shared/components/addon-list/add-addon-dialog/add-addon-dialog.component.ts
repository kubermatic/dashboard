import {Component, Input, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {MatDialogRef} from '@angular/material/dialog';

import {AddonEntity} from '../../../entity/AddonEntity';

@Component({
  selector: 'km-add-addon-dialog',
  templateUrl: './add-addon-dialog.component.html',
  styleUrls: ['./add-addon-dialog.component.scss'],
})
export class AddAddonDialogComponent implements OnInit {
  @Input() installableAddons: string[] = [];
  form: FormGroup;

  constructor(public dialogRef: MatDialogRef<AddAddonDialogComponent>) {}

  ngOnInit(): void {
    this.form = new FormGroup({
      name: new FormControl('', [Validators.required]),
    });

    if (this.installableAddons.length > 0) {
      this.form.controls.name.setValue(this.installableAddons[0]);
    }
  }

  add(): void {
    const addon: AddonEntity = {
      name: this.form.controls.name.value,
    };

    this.dialogRef.close(addon);
  }
}
