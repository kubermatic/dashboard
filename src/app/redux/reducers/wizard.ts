import { CreateNodeModel } from './../../shared/model/CreateNodeModel';
import { AWSNodeSpec } from './../../shared/entity/node/AWSNodeSpec';
import { CloudSpec } from './../../shared/entity/ClusterEntity';
import { CreateClusterModel } from './../../shared/model/CreateClusterModel';
import { DataCenterEntity } from './../../shared/entity/DatacenterEntity';
import { Action } from '../../shared/interfaces/action.interface';
import { Reducer } from 'redux';
import { BreadcrumbActions } from '../actions/breadcrumb.actions';
import { WizardActions } from 'app/redux/actions/wizard.actions';
import { FORM_CHANGED } from '@angular-redux/form';
import { DigitaloceanCloudSpec } from 'app/shared/entity/cloud/DigitialoceanCloudSpec';
import { AWSCloudSpec } from 'app/shared/entity/cloud/AWSCloudSpec';
import { OpenstackCloudSpec } from 'app/shared/entity/cloud/OpenstackCloudSpec';
import { NodeCreateSpec } from 'app/shared/entity/NodeEntity';
import { DigitaloceanNodeSpec } from 'app/shared/entity/node/DigitialoceanNodeSpec';
import { OpenstackNodeSpec } from 'app/shared/entity/node/OpenstackNodeSpec';
import { cloneDeep } from 'lodash';

const formOnStep: Map<number, string[]> = new Map([
    [0, ['clusterNameForm']],
    [1, ['setProviderForm']],
    [2, ['setDatacenterForm']],
    [3, ['nodeForm', 'sshKeyForm', 'clusterForm']],
    [4, ['submitForm']]
]);

export interface Wizard {
    step: number;
    valid: Map<string, boolean>;
    isCheckedForm: boolean;
    clusterNameForm: {
        name: string;
    };
    setProviderForm: {
        provider: string;
    };
    setDatacenterForm: {
        datacenter: DataCenterEntity;
    };
    awsClusterForm: {
        accessKeyId: string;
        secretAccessKey: string;
        vpcId: string;
        subnetId: string;
        aws_cas: boolean;
        routeTableId: string;
    };
    digitalOceanClusterForm: {
        access_token: string;
    };
    openstackClusterForm: {
        os_domain: string;
        os_tenant: string;
        os_username: string;
        os_password: string;
        os_network: string;
        os_security_groups: string;
        os_floating_ip_pool: string;
        os_cas: boolean;
    };
    nodeForm: any;
    sshKeyForm: {
        ssh_keys: string[];
    };
    cloudSpec: CloudSpec;
    clusterModel: CreateClusterModel;
    nodeModel: CreateNodeModel;
}

export const INITIAL_STATE: Wizard = {
    step: 0,
    valid: new Map(),
    isCheckedForm: false,
    clusterNameForm: {
        name: ''
    },
    setProviderForm: {
        provider: ''
    },
    setDatacenterForm: {
        datacenter: null
    },
    awsClusterForm: {
        accessKeyId: '',
        secretAccessKey: '',
        vpcId: '',
        subnetId: '',
        routeTableId: '',
        aws_cas: false
    },
    digitalOceanClusterForm: {
        access_token: ''
    },
    openstackClusterForm: {
        os_domain: 'Default',
        os_tenant: '',
        os_username: '',
        os_password: '',
        os_network: '',
        os_security_groups: '',
        os_floating_ip_pool: '',
        os_cas: false
    },
    nodeForm: null,
    sshKeyForm: {
        ssh_keys: []
    },
    cloudSpec: null,
    clusterModel: null,
    nodeModel: null
};

export const WizardReducer: Reducer<Wizard> = (state: Wizard = INITIAL_STATE, action: Action): Wizard => {
    switch (action.type) {
        case WizardActions.NEXT_STEP: {
            return Object.assign({}, state, { step: state.step + 1 });
        }
        case WizardActions.PREV_STEP: {
            return Object.assign({}, state, { step: state.step - 1 });
        }
        case WizardActions.GO_TO_STEP: {
            return Object.assign({}, state, { step: action.payload.step });
        }
        case FORM_CHANGED: {
            const valid = new Map(state.valid);
            const path = action.payload.path;

            valid.set(path[path.length - 1], action.payload.valid);
            return Object.assign({}, state, { valid });
        }
        case WizardActions.CLEAR_STORE: {
            const initialState = Object.assign({}, INITIAL_STATE);
            return Object.assign({}, state, initialState);
        }
        case WizardActions.SET_CLOUD_SPEC: {
            const cloudSpec = action.payload.cloudSpec;
            return Object.assign({}, state, { cloudSpec });
        }
        case WizardActions.SET_CLUSTER_MODEL: {
            const clusterModel = action.payload.clusterModel;
            return Object.assign({}, state, { clusterModel });
        }
        case WizardActions.SET_NODE_MODEL: {
            const nodeModel = action.payload.nodeModel;
            return Object.assign({}, state, { nodeModel });
        }
        case WizardActions.SET_VALIDATION: {
            const formName = action.payload.formName;
            const valid = new Map(state.valid);
            valid.set(formName, action.payload.isValid);

            return Object.assign({}, state, { valid });
        }
        case WizardActions.CHECK_VALIDATION: {
            const step = state.step;
            const valid = new Map(state.valid);
            const forms = formOnStep.get(step);
            const isCheckedForm = step != 4 ? !!forms.find(form => !valid.get(form)): false;

            return Object.assign({}, state, { isCheckedForm });
        }
        case WizardActions.RESET_FORMS: {
            const intialState = cloneDeep(INITIAL_STATE);
            const nextState = Object.assign({}, state);
            nextState.valid = new Map(state.valid);

            formOnStep.forEach((value, key) => {
                if (key > state.step) {
                    formOnStep.get(key).forEach(form => {
                        nextState[form] = intialState[form];
                        nextState.valid.set(form, false);
                    });
                }
            });

            return Object.assign({}, state, nextState);
        }
    }
    return state;
};
