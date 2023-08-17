import {
    API,
    IndependentPlatformPlugin,
    Logging,
    PlatformConfig,
    Service,
    Characteristic,
    PlatformAccessory,
} from 'homebridge';

import { DenonMarantzAVRAccessory } from './accessory';
import { DenonMarantzController } from './controller';
import { PLATFORM_NAME, PLUGIN_NAME } from './settings';

interface DenonMarantzAccessoryConfig {
    uniqueId: string;
    displayName: string;
    ip: string;
    zone2enabled: boolean;
    maxVolume: Number;
    defaultVolume: Number;
    defaultInput: string;
    availableInputs?: string[];
}

interface DenonMarantzConfig extends PlatformConfig {
    accessories: DenonMarantzAccessoryConfig[];
}

export class DenonMarantzAVRPlatform implements IndependentPlatformPlugin {
    public readonly Service: typeof Service = this.api.hap.Service;
    public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;
    public readonly platformAccessories: PlatformAccessory[] = [];
    public readonly externalAccessories: PlatformAccessory[] = [];

    constructor(public readonly log: Logging, public readonly config: PlatformConfig, public readonly api: API) {
        this.log.debug('Finished initializing platform:', this.config.name);

        this.api.on('didFinishLaunching', () => {
            this.discoverAVR();
        });
    }

    configureAccessory(accessory: PlatformAccessory) {
        this.log.info('Loading accessory from cache:', accessory.displayName);
        this.platformAccessories.push(accessory);
    }

    async discoverAVR() {
  
      require('events').EventEmitter.prototype._maxListeners = 50;
      
        for (const device of (<DenonMarantzConfig>this.config).accessories) {
            await this.createZoneAccessories(device);
        }

    }

    async createZoneAccessories(device: DenonMarantzAccessoryConfig) {

        let controller = new DenonMarantzController(this.log, device.ip);
        const avrAccessoryMain = await this.createAVRAccessory(device, controller, 'main');
        this.externalAccessories.push(avrAccessoryMain);

        if (device.zone2enabled) {
          const avrAccessoryZone2 = await this.createAVRAccessory(device, controller, 'zone2');
          this.externalAccessories.push(avrAccessoryZone2);
        }

        this.api.publishExternalAccessories(PLUGIN_NAME, this.externalAccessories); // strictly required for AVR or TV to be shown
    }

    async createAVRAccessory(device: DenonMarantzAccessoryConfig, controller: DenonMarantzController, zone: string) {
        let uuid = `${device.ip}_${zone}`;
        uuid = this.api.hap.uuid.generate(uuid);
        const existingAccessory = this.platformAccessories.find(accessory => accessory.UUID === uuid)

        if (existingAccessory) {
            this.log.info(`restoring from cache ${device.displayName}, with ip ${device.ip}`)
            new DenonMarantzAVRAccessory(this.log, this, existingAccessory, zone, controller);
            return existingAccessory;
        } else {~
            this.log.info(`adding accessory ${device.displayName}, with ip ${device.ip}`)

            const accessory = new this.api.platformAccessory(
                device.zone2enabled ? `${device.displayName} ${zone}` : device.displayName,
                uuid,
                this.api.hap.Categories.AUDIO_RECEIVER,
            );

            accessory.context = { device };

            new DenonMarantzAVRAccessory(this.log, this, accessory, zone, controller);

            return accessory;
        }
    }
}