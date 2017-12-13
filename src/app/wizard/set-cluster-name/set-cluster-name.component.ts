import { Observable } from 'rxjs/Observable';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ClusterNameGenerator } from '../../core/util/name-generator.service';
import { select } from '@angular-redux/store/lib/src/decorators/select';
import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: 'kubermatic-set-cluster-name',
  templateUrl: 'set-cluster-name.component.html',
  styleUrls: ['set-cluster-name.component.scss']
})
export class SetClusterNameComponent implements OnInit, OnDestroy {
  public clusterNameForm: FormGroup;
  private subscription: Subscription;

  @select(['wizard', 'clusterNameForm', 'name']) clusterName$: Observable<string>;
  public clusterName: string = '';

  constructor(private nameGenerator: ClusterNameGenerator,
              private formBuilder: FormBuilder) {
  }

  ngOnInit() {
    this.subscription = this.clusterName$.subscribe(clusterName => {
      clusterName && (this.clusterName = clusterName);
    });

    this.clusterNameForm = this.formBuilder.group({
      name: [this.clusterName, [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    });
  }

  public generateName() {
    this.clusterNameForm.patchValue({name: this.nameGenerator.generateName()});
  }

  public ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
