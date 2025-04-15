import { RouterModule, Routes } from "@angular/router";
import { KyvernoPoliciesComponent } from "./component";
import { AuthGuard, AuthzGuard } from "@app/core/services/auth/guard";
import { NgModule } from "@angular/core";
import { KyvernoPoliciyBindingListComponent } from "./policy-binding/component";
import { KyvernoPoliciyTemplateListComponent } from "./policy-template/component";
import { SharedModule } from "@app/shared/module";

const routes: Routes = [
    {
        path: '',
        component: KyvernoPoliciesComponent,
        canActivate: [AuthGuard, AuthzGuard],
    },
];

@NgModule({
    imports: [SharedModule,RouterModule.forChild(routes)],
    declarations: [
        KyvernoPoliciesComponent,
        KyvernoPoliciyBindingListComponent,
        KyvernoPoliciyTemplateListComponent,
    ]
})
export class KyvernoPoliciesModule {}
