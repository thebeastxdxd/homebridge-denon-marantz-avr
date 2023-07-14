export interface Zone {
    id: 'main' | 'zone2' | 'zone3' | 'zone4';
    text: string;
}

export interface Input {
    id:
    | "PHONO"
    | "CD"
    | "DVD"
    | "BD"
    | "TV"
    | "SAT/CBL"
    | "MPLAY"
    | "GAME"
    | "TUNER"
    | "HDRADIO"
    | "SIRIUSXM"
    | "PANDORA"
    | "LASTFM"
    | "FLICKR"
    | "SPOTIFY"
    | "IRADIO"
    | "SERVER"
    | "FAVORITES"
    | "AUX1"
    | "AUX2"
    | "AUX3"
    | "AUX4"
    | "AUX5"
    | "AUX6"
    | "AUX7"
    | "NET"
    | "BT"
    | "MXPORT"
    | "USB"
    | "IPOD DIRECT"
    | "IPOD"
    | "USB/IPOD"
    text: string;
}

export const INPUTS = [
    "PHONO",
    "CD",
    "DVD",
    "BD",
    "TV",
    "SAT/CBL",
    "MPLAY",
    "GAME",
    "TUNER",
    "HDRADIO",
    "SIRIUSXM",
    "PANDORA",
    "LASTFM",
    "FLICKR",
    "SPOTIFY",
    "IRADIO",
    "SERVER",
    "FAVORITES",
    "AUX1",
    "AUX2",
    "AUX3",
    "AUX4",
    "AUX5",
    "AUX6",
    "AUX7",
    "NET",
    "BT",
    "MXPORT",
    "USB",
    "IPOD DIRECT",
    "IPOD",
    "USB/IPOD"]

export interface Power {
    id: 'ON' | 'OFF' | 'STANDBY';
    text: string;
}