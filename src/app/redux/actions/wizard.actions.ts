import { FORM_CHANGED } from '@angular-redux/form';
import { NodeCreateSpec } from './../../shared/entity/NodeEntity';
import { CreateClusterModel } from 'app/shared/model/CreateClusterModel';
import { CloudSpec } from './../../shared/entity/ClusterEntity';
import { ActionBase } from './action.base';
import { Action } from '../../shared/interfaces/action.interface';

import { dispatch } from '@angular-redux/store';
import { CreateNodeModel } from 'app/shared/model/CreateNodeModel';

export class WizardActions extends ActionBase {
    static readonly className: string = 'WizardActions';
    static readonly NEXT_STEP = WizardActions.getActType('NEXT_STEP');
    static readonly PREV_STEP = WizardActions.getActType('PREV_STEP');
    static readonly GO_TO_STEP = WizardActions.getActType('GO_TO_STEP');
    static readonly CLEAR_STORE = WizardActions.getActType('CLEAR_STORE'); 
    static readonly SET_CLOUD_SPEC = WizardActions.getActType('SET_CLOUD_SPEC'); 
    static readonly SET_CLUSTER_MODEL = WizardActions.getActType('SET_CLUSTER_MODEL');
    static readonly SET_NODE_MODEL = WizardActions.getActType('SET_NODE_MODEL');
    static readonly SET_VALIDATION = WizardActions.getActType('SET_VALIDATION');
    
    
    @dispatch()
    static nextStep(): Action {
        return { type: WizardActions.NEXT_STEP };
    }

    @dispatch()
    static prevStep(): Action {
        return { type: WizardActions.PREV_STEP };
    }

    @dispatch()
    static goToStep(step: number): Action {
        return { type: WizardActions.GO_TO_STEP, payload: { step } };
    }

    @dispatch()
    static clearStore(): Action {
        return { type: WizardActions.CLEAR_STORE };
    }

    @dispatch()
    static setCloudSpec(cloudSpec: CloudSpec): Action {
        return { type: WizardActions.SET_CLOUD_SPEC, payload: { cloudSpec } };
    }

    @dispatch()
    static setClusterModel(clusterModel: CreateClusterModel): Action {
        return { type: WizardActions.SET_CLUSTER_MODEL, payload: { clusterModel } };
    }

    @dispatch()
    static setNodeModel(nodeModel: CreateNodeModel): Action {
        return { type: WizardActions.SET_NODE_MODEL, payload: { nodeModel } };
    }

    @dispatch()
    static setValidation(formName: string, isValid: boolean): Action {
        return { type: WizardActions.SET_VALIDATION, payload: { formName, isValid } };
    }
}
