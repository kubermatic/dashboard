/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { DashboardComponent } from "./dashboard.component";
import {WizardComponent} from "../wizard/wizard.component";
import {ReactiveFormsModule, FormsModule} from "@angular/forms";
import {HttpModule} from "@angular/http";
import {RouterTestingModule} from "@angular/router/testing";
import {Auth} from "../auth/auth.service";
import {ApiService} from "../api/api.service";
import {GlobalState} from "../global.state";
import {ClusterNameGenerator} from "../util/name-generator.service";

describe("DashboardComponent", () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        FormsModule,
        ReactiveFormsModule,
        HttpModule,
        RouterTestingModule
      ],
      declarations: [
        DashboardComponent,
        WizardComponent
      ],
      providers: [
        Auth,
        ApiService,
        ClusterNameGenerator,
        GlobalState
      ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
