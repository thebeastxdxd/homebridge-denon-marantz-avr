# homebridge-denon-marantz-avr

homebridge-plugin for Denon and Marantz AVR control with Apple-Homekit. Works with most Denon AVR since 2011, supports a second zone and implements the speaker service with Audio Receiver (AVR) characteristic.

## Installation

Follow standard installation via Homebridge UI **or** follow the instruction in [NPM](https://www.npmjs.com/package/homebridge) for the Homebridge server installation. The plugin is published through [NPM](https://www.npmjs.com/package/homebridge-denon) and should be installed "globally" by typing:

```bash
sudo npm install -g homebridge-denon-marantz-avr 
```

## Configuration

Example `platforms` section for DRA-N4 (with customized inputs):

```json
{
  "platforms": [
    {
      "platform": "denon-marantz-avr",
      "accessories": [
        {
          "uniqueId": "DenonMarantzAVR",
          "displayName": "DENON Ceol Piccolo",
          "ip": "192.168.1.2",
          "maxVolume": 50,
          "defaultVolume": 10,
          "defaultInput": "ANALOGIN",
          "availableInputs": [
            "ANALOGIN",
            "DIGITALIN1"
          ],
          "zone2enabled": false
        }
      ]
    }
  ],
}
```

## Usage in Home app

TVs and AVRs are required by HAP to be exposed as separate devices. Therefore, after usual Homekit pairing of Homebridge bridge you need to do the following in Home app:

- click `+` and select *Add Accessory*
- click *More options...*
- select device with AVR icon and name matching `displayName` from the config
- enter PIN that you chose for the bridge (either main Homebridge or plugin-dedicated)

Inputs and power can be controlled from Home app. For volume and up/down/left/right/select buttons, you must use *Apple TV remote* app and switch to AVR from top menu.

## Caveat about volume control

Unfortunately, even Audio Receiver device category in HomeKit (added in R3? R2 is latest "open-source") can't control volume using Home automation, Siri or tvOS. In other words, while neat, HomeKit can't be used to link AppleTV with Denon AVRs that don't support HDMI-CEC (e.g. ones without HDMI and connect over HDMI audio extractors). 

As a workaround you can set the following in Apple TV in section *Settings* - *Remotes and Devices* - *Home Cinema Control* - *Select Volume Control*:

- remove all IR remotes
- switch option to *Auto*
- confirm in upper level menu it says `Auto (Off)`


That way, Siri Remote volume buttons somehow still send IR signals that are understood by some Denon AVRs (incl. DRA-N4), so you can control AVR volume.

Additionaly, iOS *Control Other Speakers & TVs* in Control Center and in media streaming (AirPlay or Apple Music remote) can control tvOS volume as well (on normal equipment it'd be equal to headphone volume setting as audio over HDMI is like line level). With ability to use *Apple TV remote* app to set output AVR levels it's *semi-competent* HDMI-CEC volume control replacement.


## References

- DENON AVR control protocol - http://assets.eu.denon.com/DocumentMaster/DE/AVR1713_AVR1613_PROTOCOL_V8.6.0.pdf
- DENON SYSTEM control protocol - http://assets.eu.denon.com/DocumentMaster/DE/DRAN5_RCDN8_PROTOCOL_V.1.0.0.pdf
- Apple HomeKit Accessory Protocol (HAP) - https://developer.apple.com/apple-home/
