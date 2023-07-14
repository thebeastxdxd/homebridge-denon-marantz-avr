import { Service, PlatformAccessory, CharacteristicValue, Logging } from 'homebridge';

import { DenonMarantzAVRPlatform } from './platform';
import { DenonMarantzController } from './controller';
import {
    INPUTS,
} from './types.js';

interface CachedServiceData {
    Identifier: number;
    CurrentVisibilityState: number;
    ConfiguredName: string;
}

export class DenonMarantzAVRAccessory {
    private service: Service;
    private inputServices: Service[] = [];
    private readonly zone: string;
    private log: Logging;

    private state: {
        isPlaying: boolean; // TODO: Investigaste a better way of tracking "playing" state
        inputs: string[];
        connectionError: boolean;
    } = {
            isPlaying: true,
            inputs: [],
            connectionError: false,
        };

    constructor(
        log: Logging,
        private readonly platform: DenonMarantzAVRPlatform,
        private readonly accessory: PlatformAccessory,
        zone: string,
        private controller: DenonMarantzController,
    ) {

        this.log = log;
        // set the AVR accessory information
        this.accessory
            .getService(this.platform.Service.AccessoryInformation)!
            .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Denon/Marantz')

        this.log.info("adding television service")
        this.service = this.accessory.getService(this.platform.Service.Television) || this.accessory.addService(this.platform.Service.Television);
        this.zone = zone;
        this.init();

        // regularly ping the AVR to keep power/input state syncronised
        setInterval(this.updateAVRState.bind(this), 60000);
    }

    async init() {
        try {
            await this.updateInputSources();
            await this.createTVService();
            await this.createTVSpeakerService();
            await this.createInputSourceServices();
        } catch (err) {
            this.platform.log.error(err as string);
        }
    }

    async createTVService() {
        // Set Television Service Name & Discovery Mode
        this.service
            .setCharacteristic(this.platform.Characteristic.ConfiguredName, this.accessory.context.device.displayName)
            .setCharacteristic(
                this.platform.Characteristic.SleepDiscoveryMode,
                this.platform.Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE,
            );

        // Power State Get/Set
        this.service
            .getCharacteristic(this.platform.Characteristic.Active)
            .onSet(this.setPowerState.bind(this))
            .onGet(this.getPowerState.bind(this));

        // Input Source Get/Set
        this.service
            .getCharacteristic(this.platform.Characteristic.ActiveIdentifier)
            .onSet(this.setInputState.bind(this))
            .onGet(this.getInputState.bind(this));

        // Remote Key Set
        // this.service.getCharacteristic(this.platform.Characteristic.RemoteKey).onSet(this.setRemoteKey.bind(this));

        return;
    }

    async createTVSpeakerService() {

        this.log.info("adding television speaker service")
        const speakerService = this.accessory.getService(this.platform.Service.TelevisionSpeaker) || this.accessory.addService(this.platform.Service.TelevisionSpeaker);

        speakerService
            .setCharacteristic(this.platform.Characteristic.Active, this.platform.Characteristic.Active.ACTIVE)
            .setCharacteristic(
                this.platform.Characteristic.VolumeControlType,
                this.platform.Characteristic.VolumeControlType.ABSOLUTE,
            );
        speakerService.getCharacteristic(this.platform.Characteristic.Mute).onGet(this.getMute.bind(this)).onSet(this.setMute.bind(this))

        speakerService.getCharacteristic(this.platform.Characteristic.Volume).onGet(this.getVolume.bind(this)).onSet(this.setVolume.bind(this))

        // handle volume control
        speakerService.getCharacteristic(this.platform.Characteristic.VolumeSelector).onSet(this.setVolumeSelector.bind(this));

        return;
    }

    async createInputSourceServices() {
        this.state.inputs.forEach(async (input, i) => {
            try {
                this.log.info(`adding television input service with name ${input} `)
                const inputService = this.accessory.getServiceById(this.platform.Service.InputSource.UUID, input) || this.accessory.addService(this.platform.Service.InputSource, input, input);

                inputService
                    .setCharacteristic(this.platform.Characteristic.Identifier, i)
                    .setCharacteristic(this.platform.Characteristic.Name, input)
                    .setCharacteristic(this.platform.Characteristic.ConfiguredName, input)
                    .setCharacteristic(
                        this.platform.Characteristic.IsConfigured,
                        this.platform.Characteristic.IsConfigured.CONFIGURED,
                    )
                    .setCharacteristic(
                        this.platform.Characteristic.CurrentVisibilityState,
                        this.platform.Characteristic.CurrentVisibilityState.SHOWN,
                    )
                    .setCharacteristic(
                        this.platform.Characteristic.InputSourceType,
                        this.platform.Characteristic.InputSourceType.APPLICATION,
                    )
                    .setCharacteristic(
                        this.platform.Characteristic.InputDeviceType,
                        this.platform.Characteristic.InputDeviceType.TV,
                    );


                this.service.addLinkedService(inputService);
                this.inputServices.push(inputService);


            } catch (err) {
                this.platform.log.error(`
          Failed to add input service ${input}:
          ${err}
        `);
            }
        });
    }

    async updateInputSources() {
        INPUTS.forEach((input, i) => {this.state.inputs.push(input)})
    }

    async updateAVRState() {
        try {

            await this.controller.refresh();
            let power = this.controller.GetPowerState(this.zone);
            let source = this.controller.GetInputSource(this.zone);
            this.platform.log.debug(`AVR PING`, { power: power, input: source});

            this.service.updateCharacteristic(this.platform.Characteristic.Active, power as CharacteristicValue);

            this.service.updateCharacteristic(
                this.platform.Characteristic.ActiveIdentifier,
                this.state.inputs.findIndex((input) => input === source),
            );

            if (this.state.connectionError) {
                this.state.connectionError = false;
                this.platform.log.info(`Communication with Yamaha AVR at ${this.platform.config.ip} restored`);
            }
        } catch (error) {
            if (this.state.connectionError) {
                return;
            }

            this.state.connectionError = true;
            this.platform.log.error(`
        Cannot communicate with Yamaha AVR at ${this.platform.config.ip}.
        Connection will be restored automatically when the AVR begins responding.
      `);
        }
    }

    async getPowerState(): Promise<CharacteristicValue> {
        this.log.info(`Get power state ${this.controller.ipaddress} zone ${this.zone} power ${this.controller.GetPowerState(this.zone)} `)
        return this.controller.GetPowerState(this.zone) as CharacteristicValue;
    }

    async setPowerState(state: CharacteristicValue) {
        await this.controller.SetPowerState(this.zone, state as boolean);
    }

    async getMute(): Promise<CharacteristicValue> {
        this.log.info(`Get mute state ${this.controller.GetMuteState(this.zone)} `)
        return this.controller.GetMuteState(this.zone) as CharacteristicValue;
    }

    async setMute(state: CharacteristicValue) {
        await this.controller.SetMuteSate(this.zone, state as boolean);
    }
    
    async setVolumeSelector(direction: CharacteristicValue) {
        try {
            const currentVolume = Number(this.controller.GetVolume(this.zone));
            const volumeStep = 5;

            if (direction === this.platform.Characteristic.VolumeSelector.INCREMENT) {
                this.platform.log.info('Volume Up', currentVolume + volumeStep);
                await this.controller.SetVolume(this.zone, currentVolume + volumeStep)
            } else {
                this.platform.log.info('Volume Down', currentVolume - volumeStep);
                await this.controller.SetVolume(this.zone, currentVolume - volumeStep)
            }

        } catch (error) {
            this.platform.log.error((error as Error).message);
        }
    }

    async setVolume(value: CharacteristicValue) {
        await this.controller.SetVolume(this.zone, value as number)
    }

    async getVolume(): Promise<CharacteristicValue> {
        return this.controller.GetVolume(this.zone) as CharacteristicValue;
    }

    async getInputState(): Promise<CharacteristicValue> {
        this.log.info(`Get input state  ${this.controller.GetInputSource(this.zone)} `)
        let source = this.controller.GetInputSource(this.zone);
        return this.state.inputs.findIndex((input) => input === source);
    }

    async setInputState(inputIndex: CharacteristicValue) {
        try {
            if (typeof inputIndex !== 'number') {
                return;
            }

            const setInputResponse = await this.controller.SetInputSource(this.zone, this.state.inputs[inputIndex]);

            this.platform.log.info(`Set input: ${this.state.inputs[inputIndex]}`);
        } catch (error) {
            this.platform.log.error((error as Error).message);
        }
    }
}