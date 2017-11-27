import { NgModule } from '@angular/core';
import { DynamicFormComponent } from 'app/shared/dynamic-form/dynamic-form.component';
import { DynamicFormFieldComponent } from 'app/shared/dynamic-form/dynamic-form-field/dynamic-form-field.component';

@NgModule({
    imports: [],
    declarations: [DynamicFormComponent, DynamicFormFieldComponent],
    exports: [],
    providers: [],
})
export class DynamicFormModule { }
