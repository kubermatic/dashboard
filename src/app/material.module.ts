import { NgModule } from '@angular/core';
import {
  MdButtonModule,
  MdIconModule,
  MdInputModule,
  MdListModule,
  MdProgressSpinnerModule,
  MdSidenavModule,
  MdSnackBarModule,
  MdToolbarModule,
  MdTooltipModule,
  MdSelectModule,
  MdCheckboxModule,
  MdMenuModule,
  MdCardModule

} from '@angular/material';

@NgModule({
  imports: [
    MdButtonModule,
    MdIconModule,
    MdInputModule,
    MdListModule,
    MdProgressSpinnerModule,
    MdSidenavModule,
    MdSnackBarModule,
    MdToolbarModule,
    MdTooltipModule,
    MdSelectModule,
    MdCheckboxModule,
    MdMenuModule,
    MdCardModule
  ],
  exports: [
    MdButtonModule,
    MdIconModule,
    MdInputModule,
    MdListModule,
    MdProgressSpinnerModule,
    MdSidenavModule,
    MdSnackBarModule,
    MdToolbarModule,
    MdTooltipModule,
    MdSelectModule,
    MdCheckboxModule,
    MdMenuModule,
    MdCardModule
  ],
})

export class MaterialModule { }
