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
//   import { YamahaVolumeAccessory } from './volumeAccessory.js';
import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { Zone } from './types';
//   import { YamahaPureDirectAccessory } from './pureDirectAccessory.js';

interface DenonMarantzAccessoryConfig {
    uniqueId: string;
    displayName: string;
    ip: string;
    zone2enabled: boolean;
    maxVolume: Number;
    defaultVolume: Number;
    defaultInput: string;
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
        //   try {
        //     const baseApiUrl = `http://${this.config.ip}/YamahaExtendedControl/v1`;
        //     const deviceInfoResponse = await fetch(`${baseApiUrl}/system/getDeviceInfo`);
        //     const deviceInfo = (await deviceInfoResponse.json()) as DeviceInfo;

        //     const featuresResponse = await fetch(`${baseApiUrl}/system/getFeatures`);
        //     const features = (await featuresResponse.json()) as Features;

        //     if (deviceInfo.response_code !== 0) {
        //       throw new Error();
        //     }

        //     const device: AccessoryContext['device'] = {
        //       displayName: this.config.name ?? `Yamaha ${deviceInfo.model_name}`,
        //       modelName: deviceInfo.model_name,
        //       systemId: deviceInfo.system_id,
        //       firmwareVersion: deviceInfo.system_version,
        //       baseApiUrl,
        //     };

        //     if (this.config.enablePureDirectSwitch) {
        //       await this.createPureDirectAccessory(device);
        //     }

        //     await this.createZoneAccessories(device, 'main');

        //     features.zone.length > 1 && (await this.createZoneAccessories(device, 'zone2'));
        //     features.zone.length > 2 && (await this.createZoneAccessories(device, 'zone3'));
        //     features.zone.length > 3 && (await this.createZoneAccessories(device, 'zone4'));

        //     if (this.externalAccessories.length > 0) {
        //       this.api.publishExternalAccessories(PLUGIN_NAME, this.externalAccessories);
        //     }
        //   } catch {
        //     this.log.error(`
        //       Failed to get system config from ${this.config.name}. Please verify the AVR is connected and accessible at ${this.config.ip}
        //     `);
        //   }
        // loop over the discovered devices and register each one if it has not already been registered
        for (const device of (<DenonMarantzConfig>this.config).accessories) {
            await this.createZoneAccessories(device);


            if (this.externalAccessories.length > 0) {
                this.api.publishExternalAccessories(PLUGIN_NAME, this.externalAccessories);
            }

        }

    }

    async createZoneAccessories(device: DenonMarantzAccessoryConfig) {

        let controller = new  DenonMarantzController(this.log, device.ip);
        const avrAccessory = await this.createAVRAccessory(device, controller, 'main');
        this.externalAccessories.push(avrAccessory);

        //   await this.createVolumeAccessory(device, 'main');

        if (device.zone2enabled) {
            const avrAccessory = await this.createAVRAccessory(device, controller, 'zone2');
            this.externalAccessories.push(avrAccessory);

            // await this.createVolumeAccessory(device, 'zone2');
        }
    }

    async createAVRAccessory(device: DenonMarantzAccessoryConfig, controller: DenonMarantzController, zone: Zone['id']): Promise<PlatformAccessory> {
        let uuid = `${device.ip}_${zone}`;
        uuid = this.api.hap.uuid.generate(uuid);

        const accessory = new this.api.platformAccessory(
            `${device.displayName} ${zone}`,
            uuid,
            this.api.hap.Categories.AUDIO_RECEIVER,
        );

        accessory.context = { device };

        new DenonMarantzAVRAccessory(this, accessory, zone as unknown as Zone, controller);

        return accessory;
    }

    // async createVolumeAccessory(device: AccessoryContext['device'], zone: Zone['id']): Promise<void> {
    //   let uuid = `${device.ip}_${zone}_volume`;
    //   uuid = this.api.hap.uuid.generate(uuid);

    //   const accessory = new this.api.platformAccessory<AccessoryContext>(
    //     `AVR Vol. ${zone}`,
    //     uuid,
    //     this.api.hap.Categories.FAN,
    //   );

    //   accessory.context = { device };

    //   new DenonMarantzVolumeAccessory(this, accessory, zone);

    //   const existingAccessory = this.platformAccessories.find((accessory) => accessory.UUID === uuid);
    //   if (existingAccessory) {
    //     this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [existingAccessory]);
    //   }

    //   this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
    // }

    // async createPureDirectAccessory(device: AccessoryContext['device']): Promise<void> {
    //   const uuid = this.api.hap.uuid.generate(`${device.systemId}_${this.config.ip}_pureDirect`);

    //   const accessory = new this.api.platformAccessory<AccessoryContext>(
    //     'AVR Pure Direct',
    //     uuid,
    //     this.api.hap.Categories.SWITCH,
    //   );

    //   accessory.context = { device };

    //   new YamahaPureDirectAccessory(this, accessory);

    //   const existingAccessory = this.platformAccessories.find((accessory) => accessory.UUID === uuid);
    //   if (existingAccessory) {
    //     this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [existingAccessory]);
    //   }

    //   this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
    // }
}