import { NgModule } from "@angular/core";
import { SharedModule } from "@app/shared/module";
import { GlobalViewerComponent } from "./component";
import { RouterModule, Routes } from "@angular/router";
import { AddGlobalViewerDialogComponenet } from "./add-global-viewer-dialog/component";

const routes: Routes = [
  {
    path: '',
    component: GlobalViewerComponent
  }
];

@NgModule({
  imports: [SharedModule, RouterModule.forChild(routes)],
  declarations: [GlobalViewerComponent, AddGlobalViewerDialogComponenet]
})
export class GlobalViewerModule {}
