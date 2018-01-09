import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import {FormBuilder, ReactiveFormsModule, FormsModule} from '@angular/forms';
import {ApiService} from 'app/core/services/api/api.service';
import {HttpModule} from '@angular/http';
import {Auth} from 'app/core/services';
import {RouterTestingModule} from '@angular/router/testing';
import { SshkeyComponent } from './sshkey.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';


describe('SshkeyComponent', () => {
  let component: SshkeyComponent;
  let fixture: ComponentFixture<SshkeyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        FormsModule,
        ReactiveFormsModule,
        HttpModule,
        RouterTestingModule
      ],
      declarations: [
        SshkeyComponent,
      ],
      providers: [
        Auth,
        ApiService,
        FormBuilder,
      ],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SshkeyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
