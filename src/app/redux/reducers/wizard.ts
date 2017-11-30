import { DataCenterEntity } from './../../shared/entity/DatacenterEntity';
import { Action } from "../../shared/interfaces/action.interface";
import { Reducer } from 'redux';
import { BreadcrumbActions } from "../actions/breadcrumb.actions";
import { WizardActions } from 'app/redux/actions/wizard.actions';
import { FORM_CHANGED } from '@angular-redux/form';

const formOnStep: Map<number, string[]> = new Map([
    [0, ['clusterNameForm']],
    [1, ['setProviderForm']],
    [2, ['setDatacenterForm']],
    [3, ['awsClusterForm', 'awsNodeForm', 
        'digitalOceanClusterForm', 'digitalOceanNodeForm', 
        'openstackClusterForm', 'openstackNodeForm', 'sshKeyForm']]  
]);

export interface Wizard {
    step: number;
    valid: Map<string, boolean>;
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
    awsNodeForm: {
        node_count: number;
        node_size: string;
        root_size: number;
        ami: string;
        aws_nas: boolean;
    };
    digitalOceanClusterForm: {
        access_token: string;
    };
    digitalOceanNodeForm: {
        node_count: number;
        node_size: string;
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
    openstackNodeForm: {
        node_count: number;
        node_size: string;
        os_node_image: string;
    };
    sshKeyForm: {
        ssh_keys: string[];
    };
};

export const INITIAL_STATE: Wizard = {
    step: 0,
    valid: new Map(),
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
    awsNodeForm: {
        node_count: null,
        node_size: '',
        root_size: null,
        ami: '',
        aws_nas: false
    },
    digitalOceanClusterForm: {
        access_token: ''
    },
    digitalOceanNodeForm: {
        node_count: null,
        node_size: ''
    },
    openstackClusterForm: {
        os_domain: '',
        os_tenant: '',
        os_username: '',
        os_password: '',
        os_network: '',
        os_security_groups: '',
        os_floating_ip_pool: '',
        os_cas: false
    },
    openstackNodeForm: {
        node_count: null,
        node_size: '',
        os_node_image: ''
    },
    sshKeyForm: {
        ssh_keys: []
    }
};

export const WizardReducer: Reducer<Wizard> = (state: Wizard = INITIAL_STATE, action: Action): Wizard => {
    switch (action.type) { 
        case WizardActions.NEXT_STEP: {
            return Object.assign({}, state, {step: state.step + 1});
        }
        case WizardActions.PREV_STEP: {
            const valid = new Map(state.valid);
            const step = state.step;

            if (formOnStep.get(step)) {
                formOnStep.get(step).forEach(form => {
                    valid.set(form, false);
                });
            }

            return Object.assign({}, state, { step: state.step - 1, valid });
        }
        case WizardActions.GO_TO_STEP: {
            const step = action.payload.step;
            const valid = new Map(state.valid);

            formOnStep.forEach((value, key) => {
                if (key > step) {
                    formOnStep.get(key).forEach(form => {
                        valid.set(form, false);
                    });
                }
            });

            return Object.assign({}, state, { step, valid });
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
    }
    return state;
};
