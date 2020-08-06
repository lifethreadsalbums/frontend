'use strict';

angular.module('paceApp').
    factory('Task', ['$resource', '$q', '_', function($resource, $q, _){

        var Task = $resource( '', { }, 
        {
            generateLowResPdf: { method:'GET', url:apiUrl + 'api/lowrespdf/:id' },
            generateBinderyForm: { method:'GET', url:apiUrl + 'api/binderyform/:id' },
            
            generateHiResPdf: { method:'GET', url:apiUrl + 'api/print/Pdf/:id' },
            generateHiResJpeg: { method:'GET', url:apiUrl + 'api/print/Jpeg/:id' },
            generateHiResTiff: { method:'GET', url:apiUrl + 'api/print/Tiff/:id' },

            generatePdfCover: { method:'GET', url:apiUrl + 'api/pdfcover/:id' },
            generateJpegCover: { method:'GET', url:apiUrl + 'api/jpegcover/:id' },
            generateTiffCover: { method:'GET', url:apiUrl + 'api/tiffcover/:id' },
            
            generateProductionSheets: { method:'GET', url:apiUrl + '/api/productionsheet/:id' },
            cancelJob: { method:'DELETE', url:apiUrl + 'api/job/:id' },

            scheduleJob: { method:'POST', url:apiUrl + 'api/job' },
        });

        return Task;
  }]);