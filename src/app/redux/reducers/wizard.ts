import { CreateNodeModel } from './../../shared/model/CreateNodeModel';
import { AWSNodeSpec } from './../../shared/entity/node/AWSNodeSpec';
import { CloudSpec } from './../../shared/entity/ClusterEntity';
import { CreateClusterModel } from './../../shared/model/CreateClusterModel';
import { DataCenterEntity } from './../../shared/entity/DatacenterEntity';
import { Action } from "../../shared/interfaces/action.interface";
import { Reducer } from 'redux';
import { BreadcrumbActions } from "../actions/breadcrumb.actions";
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
    [3, ['awsClusterForm', 'awsNodeForm', 
        'digitalOceanClusterForm', 'digitalOceanNodeForm', 
        'openstackClusterForm', 'openstackNodeForm', 'sshKeyForm']]  
]);

export interface Wizard {
    step: number;
    isChanged: boolean;
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
    cloudSpec: CloudSpec;
    clusterModel: CreateClusterModel;
    nodeSpec: NodeCreateSpec;
    nodeModel: CreateNodeModel;
};

export const INITIAL_STATE: Wizard = {
    step: 0,
    isChanged: false,
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
        node_count: 3,
        node_size: 't2.medium',
        root_size: 20,
        ami: '',
        aws_nas: false
    },
    digitalOceanClusterForm: {
        access_token: ''
    },
    digitalOceanNodeForm: {
        node_count: 3,
        node_size: ''
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
    openstackNodeForm: {
        node_count: 3,
        node_size: 'm1.medium',
        os_node_image: ''
    },
    sshKeyForm: {
        ssh_keys: []
    },
    cloudSpec: null,
    clusterModel: null,
    nodeSpec: null,
    nodeModel: null
};

export const WizardReducer: Reducer<Wizard> = (state: Wizard = INITIAL_STATE, action: Action): Wizard => {
    switch (action.type) {
        case WizardActions.NEXT_STEP: {
            const nextStep = state.step + 1;
            const nextState = clearFormValues(state, nextStep);

            return Object.assign({}, state, nextState, { step: nextStep });
        }
        case WizardActions.PREV_STEP: {
            const step = state.step;

            return Object.assign({}, state, { step: state.step - 1, isChanged: false });
        }
        case WizardActions.GO_TO_STEP: {
            const step = action.payload.step;
            const nextState = clearFormValues(state, step);

            return Object.assign({}, state, { step });
        }
        case FORM_CHANGED: {
            const valid = new Map(state.valid);
            const path = action.payload.path;

            valid.set(path[path.length - 1], action.payload.valid);
            return Object.assign({}, state, { valid, isChanged: true });
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
        case WizardActions.SET_NODE_SPEC: {
            const nodeSpec = action.payload.nodeSpec;
            return Object.assign({}, state, { nodeSpec });
        }
        case WizardActions.SET_NODE_MODEL: {
            const nodeModel = action.payload.nodeModel;
            return Object.assign({}, state, { nodeModel });
        }
    }
    return state;
};

function clearFormValues(state, step) {
    const intialState = cloneDeep(INITIAL_STATE);
    const nextState = Object.assign({}, state);
    nextState.valid = new Map(state.valid);

    if (state.isChanged) {
        formOnStep.forEach((value, key) => {
            if (key >= step) {
                formOnStep.get(key).forEach(form => {
                    nextState[form] = intialState[form];
                    nextState.valid.set(form, false);
                });
            }
        });
    }

    nextState.isChanged = false;

    return nextState;
}
