import * as actions from '../actions/user';
import {IReducerSpec} from '../types/IExtensionContext';
import {merge, setSafe} from '../util/storeHelper';

// tslint:disable-next-line:no-submodule-imports
import {REHYDRATE} from 'redux-persist/constants';

export const userReducer: IReducerSpec = {
  reducers: {
    [actions.setMultiUser as any]: (state, payload) => setSafe(state, ['multiUser'], payload),
  },
  defaults: {
    multiUser: false,
  },
};
