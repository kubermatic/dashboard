import { SharedModule } from '../shared/shared.module';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { DynamicFormComponent } from './dynamic-form.component';
import { DynamicFormFieldComponent } from './dynamic-form-field/dynamic-form-field.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
    imports: [
        SharedModule
    ],
    declarations: [DynamicFormComponent, DynamicFormFieldComponent],
    exports: [DynamicFormComponent, DynamicFormFieldComponent],
    providers: [],
})
export class DynamicFormModule { }
