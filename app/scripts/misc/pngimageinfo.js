function PngImageInfo(pngData) {
    var PNG_SIGN1   = 0x89504E47;
    var PNG_SIGN2   = 0x0D0A1A0A;
    var IHDR        = 0x49484452;
    var ICCP        = 0x69434350;

    var self = this;
    
    this.imageWidth = 0;
    this.imageHeight = 0;
    this.bitDepth = 0;
    this.colorType = 0;
   	this.iccProfile = null;
    this.orientation = 1;
    this.dpiX = 300;
    this.dpiY = 300;
		
	this.getColorSpace = function() {
		var result = "UNKNOWN";
		
		switch(this.colorType)
		{
			case 0:
				result = "GRAY";
				break;
			case 2:
				result = "RGB";
				break;
			case 3:
				result = "INDEXED";
				break;
			case 4:
				result = "GRAY_ALPHA";
				break;
			case 6:
				result = "RGB_ALPHA";
				break;
            default:
                if (this.iccProfile)
                    result = this.iccProfile.colorSpaceOfData;
		}
		
		return result;
	}
		
        
    var readPng = function(data) {
        data.endian = Endian.BIG_ENDIAN;
        
        var sign1 = data.readUnsignedInt();
        var sign2 = data.readUnsignedInt();
        //check PNG signature
        if (sign1==PNG_SIGN1 && sign2==PNG_SIGN2)
        {
            var finished = false;
            while(data.getBytesAvailable()>4 && !finished)
            {
                //read chunks
                var chunkLen = data.readUnsignedInt();
                var chunkType = data.readUnsignedInt();    
                if (chunkType==IHDR)
                    readIHDR(data);
                else if (chunkType==ICCP)
                {
                    readICCP(data, chunkLen);
                    finished = true;
                } else 
                    data.position += chunkLen + 4; //jump to next chunk
            }
        } else 
			throw new Error("File is not a valid PNG image");
    }
        
    var readIHDR = function(data) {
        self.imageWidth = data.readUnsignedInt();
        self.imageHeight = data.readUnsignedInt();
        self.bitDepth = data.readByte();
        self.colorType = data.readByte();
        data.position+=7; 
    }
    
    var readICCP = function(data, chunkLen) {
        var name='';
        var b;
        //read null terminated string
        while((b = data.readUnsignedByte()) != 0)
        {
            name += String.fromCharCode(b);
        }
        //read compression method
        var cm = data.readUnsignedByte();
        
        //read compressed icc profile data
        var iccData = new Uint8Array();
        iccData = data.readBytes(iccData, 0, chunkLen - 1 - name.length);

        //icc profile data is a zlib datastream with deflate compression
        
        var inflate = new Zlib.Inflate(iccData);
        var plain = inflate.decompress();
        
		//load icc profile
		self.iccProfile = new ICCProfile(new ByteArray(plain));
	
    }

    readPng(new ByteArray(pngData));
        
}

PngImageInfo.prototype = ImageInfo;