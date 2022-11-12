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

import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {BrowserModule} from '@angular/platform-browser';
import {MatTableModule} from '@angular/material/table';
import {QuotaMockService} from '@test/services/quota-mock';
import {UserMockService} from '@test/services/user-mock';
import {QuotaService} from './service';
import {UserService} from '@core/services/user';
import {SharedModule} from '@shared/module';
import {QuotasComponent} from './component';

describe('QuotasComponent', () => {
  let fixture: ComponentFixture<QuotasComponent>;
  let component: QuotasComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule, MatTableModule],
      declarations: [QuotasComponent],
      providers: [
        {provide: QuotaService, useClass: QuotaMockService},
        {provide: UserService, useClass: UserMockService},
      ],
    }).compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(QuotasComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it('should initialize', async () => {
    expect(component).toBeTruthy();
  });

  it('should hide table when quotas are empty', async () => {
    component.isLoading = false;
    component.quotas = [];
    fixture.detectChanges();

    const element = fixture.nativeElement.querySelector('#quotas-table');

    expect(element.hidden).toEqual(true);
  });

  it('should display correct message when there are no quotas', () => {
    component.isLoading = false;
    component.quotas = [];
    fixture.detectChanges();

    const element = fixture.nativeElement.querySelector('#quotas-not-found');

    expect(element.textContent.trim()).toEqual('No quotas found');
  });
});
