import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { DynamicFormComponent } from 'app/shared/dynamic-form/dynamic-form.component';
import { DynamicFormFieldComponent } from 'app/shared/dynamic-form/dynamic-form-field/dynamic-form-field.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule
    ],
    declarations: [DynamicFormComponent, DynamicFormFieldComponent],
    exports: [],
    providers: [],
})
export class DynamicFormModule { }
