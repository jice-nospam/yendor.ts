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
    var crcTable: number[];
    function makeCRCTable() {
        var c: number;
        crcTable = [];
        for (var n: number = 0; n < 256; n++) {
            c = n;
            for (var k: number = 0; k < 8; k++) {
                c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
            }
            crcTable[n] = c;
        }
    }
    
    export function buildMatrix<T>(w: number): T[][] {
        var ret: T[][] = [];
        for ( var x: number = 0; x < w; ++x) {
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
        var crc: number = 0 ^ (-1);
        for (var i: number = 0, len: number = str.length; i < len; ++i) {
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
