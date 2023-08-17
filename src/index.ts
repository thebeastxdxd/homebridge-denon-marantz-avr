import { API } from 'homebridge';

import { PLATFORM_NAME } from './settings';
import { DenonMarantzAVRPlatform } from './platform';

export default (api: API) => {
  api.registerPlatform(PLATFORM_NAME, DenonMarantzAVRPlatform);
};

// TODO: UI settings
