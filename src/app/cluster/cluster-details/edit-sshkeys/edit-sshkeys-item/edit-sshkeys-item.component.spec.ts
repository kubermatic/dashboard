import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';
import { AppConfigService } from './../../../../app-config.service';
import { UserService } from './../../../../core/services';
import { SharedModule } from './../../../../shared/shared.module';
import { AppConfigMockService } from './../../../../testing/services/app-config-mock.service';
import { UserMockService } from './../../../../testing/services/user-mock.service';
import { EditSSHKeysItemComponent } from './edit-sshkeys-item.component';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SlimLoadingBarModule.forRoot(),
  SharedModule
];

describe('EditSSHKeysItemComponent', () => {
  let fixture: ComponentFixture<EditSSHKeysItemComponent>;
  let component: EditSSHKeysItemComponent;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        ...modules,
      ],
      declarations: [
        EditSSHKeysItemComponent
      ],
      providers: [
        MatDialog,
        { provide: UserService, useClass: UserMockService },
        { provide: AppConfigService, useClass: AppConfigMockService},
      ],
    }).compileComponents();
  }));

  beforeEach(async(() => {
    fixture = TestBed.createComponent(EditSSHKeysItemComponent);
    component = fixture.componentInstance;
  }));

  it('should create the edit sshkeys item component', async(() => {
    expect(component).toBeTruthy();
  }));
});
