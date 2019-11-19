import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {MatDialogRef} from '@angular/material';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {SlimLoadingBarModule} from 'ng2-slim-loading-bar';
import {CoreModule} from '../../../../core/core.module';
import {SharedModule} from '../../../../shared/shared.module';
import {fakeProject} from '../../../../testing/fake-data/project.fake';
import {MatDialogRefMock} from '../../../../testing/services/mat-dialog-ref-mock';
import {AddBindingComponent} from './add-binding.component';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SlimLoadingBarModule.forRoot(),
  SharedModule,
  CoreModule,
];

describe('AddBindingComponent', () => {
  let fixture: ComponentFixture<AddBindingComponent>;
  let component: AddBindingComponent;

  beforeEach(async(() => {
    TestBed
        .configureTestingModule({
          imports: [
            ...modules,
          ],
          declarations: [
            AddBindingComponent,
          ],
          providers: [
            {provide: MatDialogRef, useClass: MatDialogRefMock},
          ],
        })
        .compileComponents();
  }));

  beforeEach(async(() => {
    fixture = TestBed.createComponent(AddBindingComponent);
    component = fixture.componentInstance;
    component.projectID = fakeProject().id;
    fixture.detectChanges();
  }));

  it('should initialize', async(() => {
       expect(component).toBeTruthy();
     }));
});
