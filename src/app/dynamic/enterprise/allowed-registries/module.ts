import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {SharedModule} from '@shared/module';
import {AllowedRegistriesComponent} from './component';
import {AllowedRegistryDialog} from './allowed-registry-dialog/component';
import {AllowedRegistriesService} from './service';

const routes: Routes = [{path: '', outlet: 'allowed-registries', component: AllowedRegistriesComponent}];

@NgModule({
  imports: [SharedModule, RouterModule.forChild(routes)],
  providers: [AllowedRegistriesService],
  declarations: [AllowedRegistriesComponent, AllowedRegistryDialog],
})
export class AllowedRegistriesModule {}
