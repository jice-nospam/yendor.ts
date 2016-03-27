/// <reference path="color.ts" />
/// <reference path="position.ts" />
/// <reference path="rect.ts" />
/// <reference path="tree.ts" />

/*
	Section: core.ts
*/
module Core {
    "use strict";

    // CRC32 utility. Adapted from http://stackoverflow.com/questions/18638900/javascript-crc32
    let crcTable: number[];
    function makeCRCTable() {
        let c: number;
        crcTable = [];
        for (let n: number = 0; n < 256; n++) {
            c = n;
            for (let k: number = 0; k < 8; k++) {
                c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
            }
            crcTable[n] = c;
        }
    }
    
    export function buildMatrix<T>(w: number): T[][] {
        let ret: T[][] = [];
        for ( let x: number = 0; x < w; ++x) {
            ret[x] = [];
        }
        return ret;
    }

	/*
		Function: crc32
		Returns:
		the CRC32 hash of a string
	*/
    export function crc32(str: string): number {
        if (!crcTable) {
            makeCRCTable();
        }
        let crc: number = 0 ^ (-1);
        for (let i: number = 0, len: number = str.length; i < len; ++i) {
            crc = (crc >>> 8) ^ crcTable[(crc ^ str.charCodeAt(i)) & 0xFF];
        }
        return (crc ^ (-1)) >>> 0;
    };

	/*
		Function: toCamelCase
		Convert a string like EVENT_TYPE to camel case like EventType
	*/
    export function toCamelCase(input: string): string {
        return input.toLowerCase().replace(/(\b|_)\w/g, function(m) {
            return m.toUpperCase().replace(/_/, "");
        });
    }
}
