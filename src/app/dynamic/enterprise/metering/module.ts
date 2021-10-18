//                Kubermatic Enterprise Read-Only License
//                       Version 1.0 ("KERO-1.0”)
//                   Copyright © 2020 Kubermatic GmbH
//
// 1. You may only view, read and display for studying purposes the source
//    code of the software licensed under this license, and, to the extent
//    explicitly provided under this license, the binary code.
// 2. Any use of the software which exceeds the foregoing right, including,
//    without limitation, its execution, compilation, copying, modification
//    and distribution, is expressly prohibited.
// 3. THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND,
//    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
//    MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
//    IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
//    CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
//    TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
//    SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//
// END OF TERMS AND CONDITIONS

import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {MeteringComponent} from '@app/dynamic/enterprise/metering/component';
import {MeteringConfigComponent} from '@app/dynamic/enterprise/metering/config/component';
import {MeteringConfigurationDialog} from '@app/dynamic/enterprise/metering/config/config-dialog/component';
import {MeteringCredentialsDialog} from '@app/dynamic/enterprise/metering/config/credentials-dialog/component';
import {MeteringListComponent} from '@app/dynamic/enterprise/metering/list/component';
import {SharedModule} from '@shared/module';

const routes: Routes = [{path: '', component: MeteringComponent}];

@NgModule({
  imports: [SharedModule, RouterModule.forChild(routes)],
  declarations: [
    MeteringComponent,
    MeteringListComponent,
    MeteringConfigComponent,
    MeteringConfigurationDialog,
    MeteringCredentialsDialog,
  ],
})
export class MeteringModule {}
