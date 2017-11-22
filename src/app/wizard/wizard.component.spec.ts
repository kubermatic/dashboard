/* tslint:disable:no-unused-variable */
import {async, ComponentFixture, TestBed, inject} from "@angular/core/testing";

import { WizardComponent } from "./wizard.component";
import {FormBuilder, ReactiveFormsModule, FormsModule} from "@angular/forms";
import {ClusterNameGenerator} from "../core/util/name-generator.service";
import {ApiService} from "../api/api.service";
import {HttpModule, BaseRequestOptions, Http, XHRBackend, Response, ResponseOptions} from "@angular/http";
import {Auth} from "../core/services";
import {RouterTestingModule} from "@angular/router/testing";
import {StoreModule} from "@ngrx/store";
import {combinedReducer} from "../reducers/index";
import {MockBackend} from "@angular/http/testing";
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialModule } from '@angular/material';

describe("WizardComponent", () => {
  let component: WizardComponent;
  let fixture: ComponentFixture<WizardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        FormsModule,
        ReactiveFormsModule,
        HttpModule,
        RouterTestingModule,
        StoreModule.provideStore(combinedReducer),
        MaterialModule,
        BrowserAnimationsModule
      ],
      declarations: [
        WizardComponent
      ],
      providers: [
        Auth,
        ApiService,
        ClusterNameGenerator,
        FormBuilder,
        {
          provide: Http,
          useFactory: (mockBackend, options) => {
            return new Http(mockBackend, options);
          },
          deps: [MockBackend, BaseRequestOptions]
        },
        MockBackend,
        BaseRequestOptions
      ],
    })
    .compileComponents();
  }));

  beforeEach(inject([MockBackend], (backend: MockBackend) => {
    // define mock response
    const mockResponse = [{"metadata":{"name":"asia-east1","revision":"1"},"spec":{"country":"TW","location":"Asia-East (Taiwan)","provider":"bringyourown","bringyourown":{}},"seed":true},{"metadata":{"name":"aws-ap-northeast-1a","revision":"1"},"spec":{"country":"JP","location":"Asia Pacific (Tokyo)","provider":"aws","aws":{"region":"ap-northeast-1"}}},{"metadata":{"name":"aws-ap-northeast-2a","revision":"1"},"spec":{"country":"KR","location":"Asia Pacific (Seoul)","provider":"aws","aws":{"region":"ap-northeast-2"}}},{"metadata":{"name":"aws-ap-south-1a","revision":"1"},"spec":{"country":"AU","location":"Asia Pacific (Mumbai)","provider":"aws","aws":{"region":"ap-south-1"}}},{"metadata":{"name":"aws-ap-southeast-1a","revision":"1"},"spec":{"country":"SG","location":"Asia Pacific (Singapore)","provider":"aws","aws":{"region":"ap-southeast-1"}}},{"metadata":{"name":"aws-ap-southeast-2a","revision":"1"},"spec":{"country":"AU","location":"Asia Pacific (Sydney)","provider":"aws","aws":{"region":"ap-southeast-2"}}},{"metadata":{"name":"aws-ca-central-1a","revision":"1"},"spec":{"country":"CA","location":"Canada (Central)","provider":"aws","aws":{"region":"ca-central-1"}}},{"metadata":{"name":"aws-eu-central-1a","revision":"1"},"spec":{"country":"DE","location":"EU (Frankfurt)","provider":"aws","aws":{"region":"eu-central-1"}}},{"metadata":{"name":"aws-eu-west-1a","revision":"1"},"spec":{"country":"IE","location":"EU (Ireland)","provider":"aws","aws":{"region":"eu-west-1"}}},{"metadata":{"name":"aws-eu-west-2a","revision":"1"},"spec":{"country":"GB","location":"EU (London)","provider":"aws","aws":{"region":"eu-west-2"}}},{"metadata":{"name":"aws-sa-east-1a","revision":"1"},"spec":{"country":"BR","location":"South America (S├úo Paulo)","provider":"aws","aws":{"region":"sa-east-1"}}},{"metadata":{"name":"aws-us-east-1a","revision":"1"},"spec":{"country":"US","location":"US East (N. Virginia)","provider":"aws","aws":{"region":"us-east-1"}}},{"metadata":{"name":"aws-us-east-2a","revision":"1"},"spec":{"country":"US","location":"US East (Ohio)","provider":"aws","aws":{"region":"us-east-2"}}},{"metadata":{"name":"aws-us-west-1b","revision":"1"},"spec":{"country":"US","location":"US West (N. California)","provider":"aws","aws":{"region":"us-west-1"}}},{"metadata":{"name":"aws-us-west-2a","revision":"1"},"spec":{"country":"US","location":"US West (Oregon)","provider":"aws","aws":{"region":"us-west-2"}}},{"metadata":{"name":"do-ams2","revision":"1"},"spec":{"country":"NL","location":"Amsterdam","provider":"digitalocean","digitalocean":{"region":"ams2"}}},{"metadata":{"name":"do-blr1","revision":"1"},"spec":{"country":"IN","location":"Bangalore","provider":"digitalocean","digitalocean":{"region":"blr1"}}},{"metadata":{"name":"do-fra1","revision":"1"},"spec":{"country":"DE","location":"Frankfurt","provider":"digitalocean","digitalocean":{"region":"fra1"}}},{"metadata":{"name":"do-lon1","revision":"1"},"spec":{"country":"GB","location":"London","provider":"digitalocean","digitalocean":{"region":"lon1"}}},{"metadata":{"name":"do-nyc1","revision":"1"},"spec":{"country":"US","location":"New York","provider":"digitalocean","digitalocean":{"region":"nyc1"}}},{"metadata":{"name":"do-sfo1","revision":"1"},"spec":{"country":"US","location":"San Francisco","provider":"digitalocean","digitalocean":{"region":"sfo1"}}},{"metadata":{"name":"do-sgp1","revision":"1"},"spec":{"country":"SG","location":"Singapore","provider":"digitalocean","digitalocean":{"region":"sgp1"}}},{"metadata":{"name":"do-tor1","revision":"1"},"spec":{"country":"CA","location":"Toronto","provider":"digitalocean","digitalocean":{"region":"tor1"}}},{"metadata":{"name":"europe-west1","revision":"1"},"spec":{"country":"BE","location":"Europe-West (Belgium)","provider":"bringyourown","bringyourown":{}},"seed":true},{"metadata":{"name":"us-central1","revision":"1"},"spec":{"country":"US","location":"US-Central","provider":"bringyourown","bringyourown":{}},"seed":true}];

    // configure mock
    backend.connections.subscribe(conn => {
      conn.mockRespond(new Response(new ResponseOptions({ body: JSON.stringify(mockResponse) })));
    });

    fixture = TestBed.createComponent(WizardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("initialized in initial step and allowed to step forward right away", () => {
    component = fixture.componentInstance;
    expect(component.currentStep).toBe(0);
    fixture.detectChanges();
    expect(component.canStepForward()).toBe(true);
  });
});
