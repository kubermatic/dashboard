//                Kubermatic Enterprise Read-Only License
//                       Version 1.0 ("KERO-1.0”)
//                   Copyright © 2022 Kubermatic GmbH
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

import {TestBed, ComponentFixture} from '@angular/core/testing';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {BrowserModule} from '@angular/platform-browser';
import {QuotaCalculationService} from '../services/quota-calculation';
import {QuotaCalculationMockService} from '@test/services/quota-calculation-mock';
import {QuotaMockService} from '@test/services/quota-mock';
import {SharedModule} from '@shared/module';
import {QuotaService} from '../service';
import {QuotaWidgetComponent} from './component';
import {UserService} from '@core/services/user';
import {UserMockService} from '@test/services/user-mock';

describe('AddProjectQuotaDialogComponent', () => {
  let fixture: ComponentFixture<QuotaWidgetComponent>;
  let component: QuotaWidgetComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [QuotaWidgetComponent],
      imports: [BrowserModule, NoopAnimationsModule, SharedModule],
      providers: [
        {provide: QuotaService, useClass: QuotaMockService},
        {provide: QuotaCalculationService, useClass: QuotaCalculationMockService},
        {provide: UserService, useClass: UserMockService},
      ],
    }).compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(QuotaWidgetComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it('should initialize', async () => {
    expect(component).toBeTruthy();
  });
});
