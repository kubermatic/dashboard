import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

/* Modules */
import { SlimLoadingBarModule } from "ng2-slim-loading-bar";
import { FlexLayoutModule } from "@angular/flex-layout";
import { CustomFormsModule } from "ng2-validation";
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
    MdCardModule,
    MdDialogModule,
    MdSliderModule,
    OverlayModule,
    MdSlideToggleModule,
    MdProgressBarModule
} from '@angular/material';
import 'hammerjs';


const modules: Array<any> = [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CustomFormsModule,
    SlimLoadingBarModule,
    FlexLayoutModule,
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
    MdCardModule,
    MdDialogModule,
    MdSliderModule,
    OverlayModule,
    MdSlideToggleModule,
    MdProgressBarModule
];

@NgModule({
    imports: [
        ...modules
    ],
    exports: [
        ...modules
    ]
})

export class SharedModule { }
