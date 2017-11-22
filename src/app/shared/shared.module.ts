import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {SlimLoadingBarModule} from "ng2-slim-loading-bar";

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

const modules: Array<any> = [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SlimLoadingBarModule,
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
    declarations: [
    ],
    exports: [
        ...modules
    ]
})

export class SharedModule { }
