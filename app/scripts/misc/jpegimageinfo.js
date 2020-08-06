//
//Wrapper around jDataView which exposes an interface similar to AS3 ByteArray 
//
var Endian = {
	LITTLE_ENDIAN : "LITTLE_ENDIAN",
	BIG_ENDIAN: "BIG_ENDIAN"
};

function ByteArray(data) {
	var dv = new jDataView(data);

	this.getEndian = function() {
		return dv._littleEndian ? Endian.LITTLE_ENDIAN :
			Endian.BIG_ENDIAN;
	}

	this.setEndian = function(val) {
		dv._littleEndian = (val===Endian.LITTLE_ENDIAN);
	}

	this.setPosition = function(pos) {
		dv.seek(pos);
	}

	this.getPosition = function() {
		return dv.tell();
	}

	this.getBytesAvailable = function() {
		return dv.byteLength - dv.tell();
	}

	this.readUnsignedByte = function() {
		return dv.getUint8();
	}

	this.readByte = function() {
		return dv.getInt8();
	}

	this.readUnsignedShort = function() {
		return dv.getUint16();
	}

	this.readUnsignedInt = function() {
		return dv.getUint32();
	}

	this.readMultiByte = function(len) {
		return dv.getString(len);
	}

	this.readBytes = function(dest, destOffset, len) {

		var chunk = dv.getBytes(len);
		var destLength = dest.length;
		var result = new Uint8Array(dest.length + chunk.length);

    	result.set(dest);
    	result.set(chunk, destLength);

    	return result;
	}

	this.readUTFBytes = function(len) {
		return dv.getString(len, dv.tell(), 'utf8');
	}
}

//TODO: make sure getters and setters work in all browsers we support
ByteArray.prototype = {
	get position() {
		return this.getPosition();
	},

	set position(val) {
		this.setPosition(val);
	},

	get endian() {
		return this.getEndian();
	},

	set endian(val) {
		this.setEndian(val);
	}
};

//prototype for JpegImageInfo and PngImageInfo
var ImageInfo = {
    getThumbnailAsBase64: function() {
        if (this.thumbBytes) {
            var binary = String.fromCharCode.apply(window, this.thumbBytes);
            var base64 = btoa(binary);
            return base64;
        }
    },

    getThumbnailAsDataURL: function() {
        if (this.thumbBytes) {
            
            return 'data:image/jpeg;base64,' + this.getThumbnailAsBase64();

        }
        return this.thumbDataURL;
    },

    getThumbnailAsImage: function() {

        if (this.thumbBytes) {

            //TODO: make sure this code is cross browser compatible
            var URL = window.URL || window.webkitURL;

            var img = new Image();
            var blob = new Blob([this.thumbBytes], {'type': 'image/jpeg'});
            img.src = URL.createObjectURL(blob);
            img.onload = function(e) {
                URL.revokeObjectURL(img.src);
            }
            return img;
        } else if (this.thumbDataURL) {
            var img = new Image();
            img.src = this.thumbDataURL;
            return img;
        }

    }
};

function JpegImageInfo(jpegData) {

	var SOI_MAKER 	= [0xff, 0xd8],
		APP1_MAKER 	= [0xff, 0xe1],
		APP2_MAKER 	= [0xff, 0xe2],
        APP13_MAKER = [0xff, 0xed],
		SOF0_MAKER 	= [0xff, 0xc0],
        SOF2_MAKER 	= [0xff, 0xc2],
        EXIF 		= 'Exif',
        ICC_PROFILE_SIGNATURE = 'ICC_PROFILE',
        PHOTOSHOP_SIGNATURE = 'Photoshop 3.0',
        IRB_SIGNATURE = '8BIM',
        XMP_SIGNATURE = '://ns.adobe.com/xap/1.0/'; //http://ns.adobe.com/xap/1.0/\x00"

    var _iccProfileData,
    	that = this;

    this.dataPrecision = 0;
	this.imageWidth = 0;
	this.imageHeight = 0;
	this.numComponents = 0;
	this.thumbBytes = 0;
    this.dpiX = 300;
    this.dpiY = 300;
    this.orientation = 1;
    this.rating = 0;

    this.getColorSpace = function() {
        if (this.numComponents==1)
            return "GRAY";
        else if (this.numComponents==3)
            return "RGB";
        else if (this.numComponents==4)
            return "CMYK";
        else if (this.iccProfile)
            return this.iccProfile.colorSpaceOfData;
        
        return "UNKNOWN";
    };
    
	var compareStreamBytes = function(stream, data, offset) {
		var b;
		if (offset>0)
			stream.setPosition(offset);

		for (var i = 0; i < data.length; i++) {
			b = stream.readUnsignedByte();
			//trace('0x'+b.toString(16));
			if (b != data[i]) return false;
		}
		return true;
	};

	var readMarker = function(stream) {
		return [stream.readUnsignedByte(), stream.readUnsignedByte()];
	};

	var compareArrays = function(a, b) {
		if (a.length!=b.length)
			return false;
		
		for (var i = 0; i < a.length; i++) {
			//trace('0x'+a[i].toString(16));
			if (a[i]!=b[i])
				return false;
		}
		return true;
	};

	var parseXmpPacket = function(xmp) {
        var regexp = /<x:xmpmeta\b[^>]*>(.*?)<\/x:xmpmeta>/img;
        //console.log(xmp);
        xmp = xmp.replace(/(\r\n|\n|\r)/gm,"");

        var res = regexp.exec(xmp);
        if (res && res.length>0)
        {
            var rdfDescRegexp = /<rdf:RDF\b[^>]*>.*<rdf:Description(\b[^>]*)>.*<\/rdf:Description>.*<\/rdf:RDF>/img;
            var rdfDescRes = rdfDescRegexp.exec(res[1]);
            if(rdfDescRes && rdfDescRes.length > 0) {
                var orientationRegexp = /tiff:Orientation=\"([^\"]*)\"/img;
                var orientationRes = orientationRegexp.exec(rdfDescRes[1]);
                if(orientationRes && orientationRes.length > 0) {
                    this.orientation = parseInt(orientationRes[1]);
                    //console.log('Orientation found in XMP', orientation);
                }

                var ratingRegexp = /xap:Rating=\"([^\"]*)\"/img;
                var ratingRes = ratingRegexp.exec(rdfDescRes[1]);
                if (ratingRes && ratingRes.length > 0) {
                    this.rating = parseInt(ratingRes[1]);
                    console.log('Rating found in XMP', rating);
                }
            }
  		}
    };

	var readAPP1Section = function(stream, readThumbnail) {
        var oldEndian = stream.endian;
        var dataPosition = stream.position;
        var dataSize = stream.readUnsignedShort();
        
        var exif = stream.readMultiByte(4);
        if (exif===EXIF) {
            //console.log("EXIF found");

            var zeros = stream.readUnsignedShort();
            var tiffStartPosition = stream.getPosition();
            //read tiff header
            var tiff1 = stream.readUnsignedShort();
            if (tiff1==0x4949)
                stream.endian = Endian.LITTLE_ENDIAN;
            else
                stream.endian = Endian.BIG_ENDIAN;
            var tiff2 = stream.readUnsignedShort();
            var ifd0Offset = stream.readUnsignedInt();
        
            stream.position = tiffStartPosition + ifd0Offset;
            
            var numFields = stream.readUnsignedShort();
            var thumbDataOffset = 0;
            var thumbDataLen = 0;
            var tag, type, count, offset;
            var i;
            
            var xresolutionOffset = 0;
            var yresolutionOffset = 0;
            var orientationOffset = 0;
            
            //console.log('numFields=',numFields);
            for(i=0;i<numFields;i++)
            {
                //trace("field "+i);
                tag = stream.readUnsignedShort();
                type = stream.readUnsignedShort();
                count = stream.readUnsignedInt();
                offset = stream.readUnsignedInt();
                //console.log("tag="+tag, "type="+type, "count="+count, "offset="+offset);
                if (tag==282) //XResolution
                    xresolutionOffset = offset;
                else if (tag==283) //YResolution
                    yresolutionOffset = offset;
                else if (tag==274 && type==3) //Orientation
                    that.orientation = offset;
            }
            var nextIFDOffset = stream.readUnsignedInt();
            //trace('next IFD offset', nextIFDOffset);
            if (nextIFDOffset>0)
            {
                stream.position = tiffStartPosition +  nextIFDOffset;
                numFields = stream.readUnsignedShort();
                //console.log('IDF1 numFields=',numFields);
                for(i=0;i<numFields;i++)
                {
                    //trace("field "+i);
                    tag = stream.readUnsignedShort();
                    type = stream.readUnsignedShort();
                    count = stream.readUnsignedInt();
                    offset = stream.readUnsignedInt();
                    
                    //console.log("tag="+tag, "type="+type, "count="+count, "offset="+offset);
                    if (tag==513)
                        thumbDataOffset = offset;
                    else if (tag==514)
                        thumbDataLen = offset;
                }
            }
            
            if (xresolutionOffset > 0)
            {
                stream.position = tiffStartPosition + xresolutionOffset;
                that.dpiX = stream.readUnsignedInt() / stream.readUnsignedInt();
            }
            
            if (yresolutionOffset > 0)
            {
                stream.position = tiffStartPosition + yresolutionOffset;
                that.dpiY = stream.readUnsignedInt() / stream.readUnsignedInt();
            }
            
            if (readThumbnail && thumbDataOffset > 0 && thumbDataLen>0)
            {
                //read thumb
                stream.position = tiffStartPosition + thumbDataOffset;
                that.thumbBytes = new Uint8Array();
                that.thumbBytes = stream.readBytes(that.thumbBytes, 0, thumbDataLen);
            }            
            
        } else if (exif=="http") {
            var header = stream.readMultiByte(XMP_SIGNATURE.length);
            if (header===XMP_SIGNATURE)
            {
                //read XMP packet
                var nullChar = stream.readByte();
                var xmp = stream.readUTFBytes(dataSize - (2 + 29));
                parseXmpPacket(xmp);
                //console.log(xmp);
            }
        }
        
        stream.endian = oldEndian;
        stream.position = dataPosition + dataSize;
    };

    var readAPP2Section = function(stream) {
		var dataSize = stream.readUnsignedShort();
		
		var icc_sig = stream.readMultiByte(11);
		if (icc_sig===ICC_PROFILE_SIGNATURE) {
			var nullByte = stream.readUnsignedByte();
			var chunkNumber = stream.readUnsignedByte();
			var numChunks = stream.readUnsignedByte();
			
			if (!_iccProfileData)
				_iccProfileData = new Uint8Array();
			
			_iccProfileData = stream.readBytes(_iccProfileData, _iccProfileData.length, dataSize - 16);
			//console.log('iccProfileData', _iccProfileData);

			//trace('read icc profile chunk ' + chunkNumber + " of " + numChunks);
		} else {
            stream.position += (dataSize - 13);
        }
	};

    var readIRBBlock = function(stream) {
        /*
        structure of an image resource block, taken from here: http://search.cpan.org/dist/Image-MetaData-JPEG/lib/Image/MetaData/JPEG/Structures.pod
        additional info here: http://www.adobe.com/devnet-apps/photoshop/fileformatashtml/#50577409_pgfId-1037504
        [Record name]    [size]   [description]
        ---------------------------------------
        (Type)           4 bytes  Photoshop uses '8BIM' from ver 4.0 on
        (ID)             2 bytes  a unique identifier, e.g., "\004\004" for IPTC
        (Name)             ...    a Pascal string (padded to make size even)
        (Size)           4 bytes  actual size of resource data
        (Data)             ...    resource data, padded to make size even
        */
        //signature
        var irb = {};
        irb.signature = stream.readMultiByte(4);
        if (irb.signature!==IRB_SIGNATURE) {
            return null;
        }
        //ID
        irb.id = stream.readUnsignedShort();
        var strLen = stream.readUnsignedByte();
        if (strLen%2==0) strLen++;
        irb.name = stream.readMultiByte(strLen);
        irb.dataLength = stream.readUnsignedInt();
        irb.data = new Uint8Array();
        irb.data = stream.readBytes(irb.data, 0, irb.dataLength);

        if (irb.dataLength%2!==0) {
            //padded byte
            stream.readUnsignedByte();
        }
        return irb;
    };

    var readPhotoshop5Thumb = function(irb) {  
        /*
        more info here: http://www.adobe.com/devnet-apps/photoshop/fileformatashtml/#50577409_74450
        */
        var stream = new ByteArray(irb.data),
            headerLen = 28;
        //skip header
        stream.position = headerLen;

        that.thumbBytes = new Uint8Array();
        that.thumbBytes = stream.readBytes(that.thumbBytes, 0, irb.dataLength - headerLen);
    };

    var readAPP13Section = function(stream) {
        var PHOTOSHOP5_THUMB_ID = 0x040C,
            PHOTOSHOP4_THUMB_ID = 0x0409;

        //read photoshop medatata
        var dataPosition = stream.position;
        var dataSize = stream.readUnsignedShort(),
            sigLength = PHOTOSHOP_SIGNATURE.length;
        
        var sig = stream.readMultiByte(sigLength);
        if (sig===PHOTOSHOP_SIGNATURE) {
            //console.debug('Photoshop medatata found');
            //null byte
            stream.readUnsignedByte();
            //read IRB blocks
            var thumbFound = false,
                irb;
            while( !thumbFound && (irb = readIRBBlock(stream)) ) {
                //console.debug('irb found', '0x' + irb.id.toString(16));
                if (irb.id===PHOTOSHOP5_THUMB_ID) {
                    //console.debug('Photoshop 5 thumb found');
                    readPhotoshop5Thumb(irb);
                    thumbFound = true;
                }
            }
        } 
        stream.position = dataPosition + dataSize;
    };

	var readSOF0Section = function(stream) {
		var dataSize = stream.readUnsignedShort();
		that.dataPrecision = stream.readByte();
		that.imageHeight = stream.readUnsignedShort();
		that.imageWidth = stream.readUnsignedShort();
		that.numComponents = stream.readByte();
	};

	var read = function(data) {

		var data = new ByteArray(data);

		if (compareStreamBytes(data, SOI_MAKER)) {
			//console.log('SOI_MAKER found')

			var finished = false;
			while(data.getBytesAvailable()>4 && !finished)
			{
				var marker = readMarker(data);
				
                if (compareArrays(marker, APP13_MAKER)) {
                    readAPP13Section(data);
                } else if (compareArrays(marker, APP1_MAKER)) {
                    //console.log('app1 found, pos = 0x' + data.position.toString(16));
                    readAPP1Section(data, true);
                } else if (compareArrays(marker, APP2_MAKER)) {
					//console.log('app2 found, pos = 0x' + data.position.toString(16));
					readAPP2Section(data);
				} else if (compareArrays(marker, SOF0_MAKER) || compareArrays(marker, SOF2_MAKER)) {
					//console.log('sof0 found, pos = 0x' + data.position.toString(16));
					readSOF0Section(data);
					finished = true;
				} else {
					var dataSize = data.readUnsignedShort();
					data.position += ( dataSize - 2 );
				}
                //printArray(marker);
			}		
			
			if (data.getBytesAvailable()==0)
				throw new Error("Error loading JPEG file");
			
			// console.log('w=',_imageWidth, 'h=', _imageHeight,
			// 	'numComponents=', _numComponents, 
			// 	'dpiX=', _dpiX, 'dpiY=', _dpiY,
			// 	'thumb=', _thumbBytes);
			
			if (finished && _iccProfileData!=null && _iccProfileData.length>0) {
			 	//read icc profile
			 	that.iccProfile = new ICCProfile(new ByteArray(_iccProfileData));
			}
			
		} else 
			throw new Error("File is not a valid JPEG image");

	} 

	read(jpegData);

};

JpegImageInfo.prototype = ImageInfo;
