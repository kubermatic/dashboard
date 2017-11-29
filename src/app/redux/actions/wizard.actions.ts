import { ActionBase } from './action.base';
import { Action } from '../../shared/interfaces/action.interface';

import { dispatch } from '@angular-redux/store';

export class WizardActions extends ActionBase {
    static readonly className: string = 'WizardActions';
    static readonly NEXT_STEP = WizardActions.getActType('NEXT_STEP');
    static readonly PREV_STEP = WizardActions.getActType('PREV_STEP');
    static readonly GO_TO_STEP = WizardActions.getActType('GO_TO_STEP');
    static readonly CLEAR_STORE = WizardActions.getActType('CLEAR_STORE'); 
    
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
}
