import { SharedModule } from '../../shared/shared.module';
import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { AddMemberComponent } from './add-member.component';
import { MatDialogRefMock } from '../../testing/services/mat-dialog-ref-mock';
import { ProjectMockService } from '../../testing/services/project-mock.service';
import { ApiService, ProjectService } from '../../core/services';
import { asyncData } from '../../testing/services/api-mock.service';
import { fakeMember } from '../../testing/fake-data/member.fake';
import { MatDialogRef } from '@angular/material';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SlimLoadingBarModule.forRoot(),
  SharedModule
];

describe('AddProjectComponent', () => {
  let fixture: ComponentFixture<AddMemberComponent>;
  let component: AddMemberComponent;

  beforeEach(async(() => {
    const apiMock = jasmine.createSpyObj('ApiService', ['createMember']);
    apiMock.createMember.and.returnValue(asyncData(fakeMember()));

    TestBed.configureTestingModule({
      imports: [
        ...modules,
      ],
      declarations: [
        AddMemberComponent
      ],
      providers: [
        { provide: MatDialogRef, useClass: MatDialogRefMock },
        { provide: ApiService, useValue: apiMock },
        { provide: ProjectService, useClass: ProjectMockService },
      ],
    }).compileComponents();
  }));

  beforeEach(async(() => {
    fixture = TestBed.createComponent(AddMemberComponent);
    component = fixture.componentInstance;
  }));

  it('should create the add member component', async(() => {
    expect(component).toBeTruthy();
  }));
});
