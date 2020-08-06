/* jshint worker:true */
/* global JpegImageInfo, PngImageInfo, getImageInfoClass, onError, FileReaderSync, createImageInfo, arrayBufferToBase64 */

importScripts('../../bower_components/jdataview/dist/browser/jdataview.js');
importScripts('../../bower_components/zlib.js/bin/inflate.min.js');
importScripts('../misc/jpegimageinfo.js');
importScripts('../misc/pngimageinfo.js');
importScripts('../misc/iccprofile.js');


self.onmessage = function (e) {
	"use strict";

	try {
		var workerStart = new Date().getTime();
		var binaryReader = new FileReaderSync();

		var files = e.data.files;

		var key,
			numFiles = 0;
		for(key in files) {
			var fileStart = new Date().getTime();
			var file = files[key];
			var binaryString = binaryReader.readAsArrayBuffer(file);
			var ImageInfoClass = getImageInfoClass(file);
			var imageInfo = new ImageInfoClass(binaryString);

			postMessage({
				type: 'SUCCESS',
				text: 'Loaded ' + file.name + ' in: ' + (new Date().getTime() - fileStart) + ' ms',
				imageData: {
					key: key,
					file: file,
					imageInfo: createImageInfo(imageInfo, file.type, binaryString),
				}
			});
			numFiles++;
		}

		postMessage({
			type: 'FINISH',
			text: 'Processed ' + numFiles + ' files in: ' + (new Date().getTime() - workerStart) + ' ms'
		});
	} catch(ex) {
		onError(ex);
	}
};

self.onError = function(ex, customMessage) {
	"use strict";

	postMessage({
		type: 'FAILURE',
		text: 'ERROR: ' + ex.toString(),
		message: customMessage,
	});
};

self.getImageInfoClass = function(file) {
	"use strict";

    var imageInfoClass;
    if (file.type==='image/jpeg')
        return JpegImageInfo;
    else if (file.type==='image/png')
        return PngImageInfo;
    else
        throw new Error('Image type not supported');
};

self.arrayBufferToBase64 = function( buffer ) {
	"use strict";

    var binary = '',
        bytes = new Uint8Array( buffer ),
        len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
        binary += String.fromCharCode( bytes[i] );
    }
    return btoa( binary );
};

self.createImageInfo = function(imageInfo, imageType, binaryString) {
	"use strict";

	var result = {
	    dataPrecision: imageInfo.dataPrecision,
	    width: imageInfo.imageWidth,
	    height: imageInfo.imageHeight,
	    numComponents: imageInfo.numComponents,
	    thumbBytes: imageInfo.thumbBytes,
	    dpiX: imageInfo.dpiX,
	    dpiY: imageInfo.dpiY,
	    orientation: imageInfo.orientation,
	    rating: imageInfo.rating,
	    iccProfile: imageInfo.iccProfile ? imageInfo.iccProfile.desc : 'Not embedded',
	    colorSpace: imageInfo.getColorSpace(),
	    status: 'New'
	};
	// if (!imageInfo.thumbBytes) {
	// 	var base64 = arrayBufferToBase64(binaryString);
	// 	result.imageDataUrl = 'data:' + imageType + ';base64,' + base64;
	// }
    
    return result;
};
