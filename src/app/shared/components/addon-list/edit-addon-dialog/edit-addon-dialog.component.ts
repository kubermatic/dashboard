import {Component, Input, OnInit} from '@angular/core';
import {AddonEntity} from '../../../entity/AddonEntity';

@Component({
  selector: 'km-edit-addon-dialog',
  templateUrl: './edit-addon-dialog.component.html',
  styleUrls: ['./edit-addon-dialog.component.scss'],
})
export class EditAddonDialogComponent implements OnInit {
  @Input() addon: AddonEntity;

  constructor() {}

  ngOnInit(): void {}

  edit(): void {}
}
