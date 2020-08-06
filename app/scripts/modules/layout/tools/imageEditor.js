PACE.ImageEditor = function(layoutController, options) {
    "use strict";

    /* jshint indent:false */
    var settings = {
        swapFillStyle: 'rgba(119, 210, 246, 0.5)',
        circleFillStyle: 'rgba(137, 137, 137, 0.5)',
        circleStrokeStyle: '#666666',
        cornerStrokeStyle: '#ff7e01',
        cornerFillStyle: '#ffa500',
        rotateOrangeStyle: 'rgba(227, 138, 30, 0.5)',
        scaleOrangeStyle: 'rgba(227, 138, 30, 1)',
        rotateBlueStyle: 'rgba(17, 170, 211, 0.5)',
        scaleBlueStyle: 'rgba(17, 170, 211, 1)'
    };

    var frameRotateCursors = [
        /* top left */     "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAATCAYAAAByUDbMAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAVNJREFUeNpi/P//PwMpgPHAlxogxf3fgacSQ44Mwy4BKV0g3gDEhUBDH5BkGNAAISDlDMT/gLgXiOWRpGuBBrYQNAxoiAqQ6gRifyBmJmBnHU7DgAZNA1KZSEJvgfgrEEsCMSsWLVOZcBi0DMkgUBjFArEU0Dsg711DU34HiLWAcjksWAwqB1KRUC7Ii5VAhdic/xuI04Fy87FGANAgXahLQGA5UGEUFsu6gRQPEFcA5T/iTBpAhROAVD40fFSBit+TkmzQw8wXSk8j1SAUw4CuAsUQP5R7hoEMgOwyKSAWhkb/VnIMY2TY/xmU1wqB+DUQqwPxT2gkaABxDdC7k4g1jAXqOiEoBgF2IDaFsmVJchkoNoHhdQLINkeTOwp0lQ05YdaBRa6X5DCDpTOg62YDqRSo+Cagq/wpMQw59YPy2nWyDYMaOB1I/QEalEtO0gAIMACroYC61XVmXwAAAABJRU5ErkJggg==') 6 6, default",
        /* top right */    "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAATCAYAAAByUDbMAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoV2luZG93cykiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6QjQxMTA1MzMzOEMzMTFFNEE3RkJGN0JBRUE0OEI4NzMiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6QjQxMTA1MzQzOEMzMTFFNEE3RkJGN0JBRUE0OEI4NzMiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDpCNDExMDUzMTM4QzMxMUU0QTdGQkY3QkFFQTQ4Qjg3MyIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDpCNDExMDUzMjM4QzMxMUU0QTdGQkY3QkFFQTQ4Qjg3MyIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PpK8KpMAAAFfSURBVHjapJM9SwNBEIZvY+yCov4AQbBQUEsLG0HEMgYre0ERVMRCG220CKQTJJXYWViIKNbmJ0gCipBCEQQRBU0s/CDnMzCB5cgd2XXg4b2b2Xtv9nbOhGEYRMOU6jtII5zM7AUOYWwzTGaRLRiHN8z6nM0wGeF6FRas2h3MwBOmP22ZBVe1IrqUsOYV3uECDjGuxC1MwW9M7Qs+QbY6AGtQZhebsWa8aQUdhvNIrQzdkIVd7VAij+FxOweQQzZgAmq8qMuq9SAHMK+pIvXlWDPrwQLyyOL9FrU80tzqIGuqiWaJJ1aqG+QaRuEUszn7AJyCh+XtBb3NYt7rbaZxogfSAVP/MqO7bx0biYbXN9ODmdZbGadOeIAP6Tbt2FQGxiK5ftVL185kiF+0IzvO2Hou5fit5B9dbFFa9x2NI6RqpbbJ3XsNrW53CLlRc9PMpz1H4xZD+U+f7fyfAAMA1qmDvbrTTQgAAAAASUVORK5CYII=') 12 6, default",
        /* bottom right */ "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAATCAYAAAByUDbMAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAVNJREFUeNpi/P//PwM5gPHAl8lAiuW/A08mXIwcw4AGaQKpa1CuHtDAyyAGEwN5oAOJnUe2y4CuCgRS69CEA4Gu20COy4qxiFWQ7DKgq7qBVAkO6XpSXfYYiD8D8Wkg/gkVuwnE74D4H7mxyQykPgIxNxArAMPrISWx6Q016C0QP4MJkmuYCZT+CHTVb7INA3pREEhlQbmbkeVYsCjmhybKL0BbS7GYNxWIhaHsuTgNAxqUCKRmAjErEF9Ek2MEUu1AHAlLW7BshGIYNK9tAmIVLC5lA1JhQAxypR5UeDnQoE4MtQz7P08B0tlYvAMK2OfQWBNGEp8ONCgLW3iCXPYSR1iDvCoHZf8F4o1AXA406A7OyIElWqB3aoBUM5LcQ2g+BMX4XqAh7wjGNHIOABqoAKT6gTgAiC8DDdAjJdmgxCZQ8wNQcQI0FBRrX0lNgwABBgBzI3DZ9PCXTgAAAABJRU5ErkJggg==') 13 13, default",
        /* bottom left */  "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAATCAYAAAByUDbMAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAUpJREFUeNpi/P//PwMMMB74UgukxP878OQwkAEY0QyDcbSABl4n1TAmJINqkMQ3ke0yoEEKQPZ9NLkkoOvmk+OyfixyM4GW8JNkGFBDO5AOwCLHCsQdpBjGAsRfgfgyEPMBsTwQ/wbia1D5L2TFJtCFwUBqDRA/AoaVPDkRwISFzQ00mI1Sw/YC8V8gFgbiMIoMA3rtHZDaCOWWAl3HSInLQKAcSusBcTvWQD7wJQ+IuwlmJ6jiaUAqE8pdDsTZQFe/R5L/BKR4gfgoEPcC5dbjNAyqYRmQioRy3wIxyIIzQLwViI8DsSla1qsA5WWshkENLMeSaL9C0yY7Fi1TmHAFJtCmTmjYTQTie1AXcuMwCJwBcLoMi0tB2UsKiHcCsTqS1BwgngS0/DLRhiEZCnKhEBCfBAUD0JANyHmTVAAqYZiAhjShSwAEGADHDndS8YFkRAAAAABJRU5ErkJggg==') 6 12, default"
        ],
        contentRotateCursors = [
        /* top left */     "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAATCAYAAAByUDbMAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAUJJREFUeNpi/P//PwMp4M+GuBogxc0SsKgSXY7x9/pYBhLBJSDWBeINQFwIxA9gEkxEGiAExKFAHAzEfFCxACC+D8Q1xLpMBYg7gdgfiJkJWFjHgkdyGhBnIvHfAvFXIJYEYlYs6sVxeXMZkkGgMAI5XwqI5YH4GpraO0CsBcQ52AwrB+JIKBvkRQMgXgLEv9DU/QbiJCBWBeLrIAF0b4JiqQPKXg7EFVgs2w3Ex6FyH5El0A1LRgqfbBxBUIorkNG96YsU+O9JTYDIhoFiiB/KPsNABkA2DBRbwtDo30quYTXQMNqJFI6gAP4ExHmkGMYCNVAIikGAHYhNoWxZUgyDZacTQGyOJncUiG3ICbMOLHK95EYAqDiZgyS+CYjXk2oYI6xwBBZ6utB8CAJawMLvOtmGQQ2cDqKABuWSkzQAAgwAQVJHgAL4vvEAAAAASUVORK5CYII=') 6 6, default",
        /* top right */    "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAATCAYAAAByUDbMAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoV2luZG93cykiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6RDJEM0ZDNjkzOEMzMTFFNDhBMkVDNjQwQjAyM0U3QUQiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6RDJEM0ZDNkEzOEMzMTFFNDhBMkVDNjQwQjAyM0U3QUQiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDpEMkQzRkM2NzM4QzMxMUU0OEEyRUM2NDBCMDIzRTdBRCIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDpEMkQzRkM2ODM4QzMxMUU0OEEyRUM2NDBCMDIzRTdBRCIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/Pketq1cAAAFSSURBVHjapNTPK0RRFMDxO7zZyYQ/YEpKKfkD2MmWmSULK+VHoUmSQsksiJWSlZSFhY2J/A/WLGYzCzZKkpAFJs/31Flct/ueeW9Ofbq/Zk73nfvuy4RhaCTqlUljxQZ+UDYNRlA4MS3OXAHX2ETJJIxAd9VPs4Apa+0JeTzgu6FkJDqknfGs9eIOz3jFJY5wG5VMHrMesfaJD3ShG4u4wUpkMgo3T9uHC2dN/pjDGLZ0hxLbOPUlyzinWcQSBvGOduu3HTjAuI6lPHNxp3mOIexhzVl7wQR2dDyLHrdmvljGfsTaqpbAWIljk8WF1GVX+1LPzmaSSZzpgbRiuNlkX/raGL123tP8L+TxRrQvr1MW93iT3QYJd9SGAWcur+1V0p3l9M5mnfkK71kxac3kjk575ktpD+AYNWu8rh+E1Kc5avXLf75nKaKq9/TRnvwVYAB7EVRRRjRqUgAAAABJRU5ErkJggg==') 12 6, default",
        /* bottom right */ "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAATCAYAAAByUDbMAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAUlJREFUeNpi/P//PwM54M+GuMlAioUlYFEmTIyRHMOABmkCqWtQrh7QwMtgw36vjyXHYRuB2A/KngPEqSAGExkGBSIZBAIpQBxArmHFWMQqyDGsG4itsYibA3EdqYY9BuLPQHwaiH9CxW4C8Tsg/kduBDAD8Ucg5gZiBSB+SG6YgYA31KC3QPwMJkiuYSZQGuS635QYJgjEWVD2ZmQJbIbxA/F0aMxhA1OBWBjKnosswYKmMBGIZwIxKxBfRJNjBOJ2II5ESluXsRkGymubgFgFi0vYgDgMiEtB+RAqthyIO9EVggybAsTZWAzRgkY5N5K3GKBBkIXN/yDDXuIIG5BX5aDsv9DMXQ7Ed3DFDCgCmqHhUYsmB3JVCNSLYkAcjM8g9NhsAWJFIN4A5X8C4rVAvBqaXQgCrIUjsPADxdpXYKHXQkoCBAgwAG+oR/KvKewpAAAAAElFTkSuQmCC') 13 13, default",
        /* bottom left */  "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAATCAYAAAByUDbMAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAT1JREFUeNpi/P//P8OfDXEMUFALxOJAnMNAAmAJWASmmdDEm4A4G4g1GcgAyIbVILE3UWKYAhA3I4mrAHEiuYb1Y5GbCcT8JBkGDPx2IB2ARY4ViDtIiggg/grEl4GYD4jlgfg3EF+Dyn8hxTBGpKQRDMRrgPgR1FCKkgaMzQ3EbJQmjb1A/BeIhYE4jFLD3gHxRii7FBQElBgGAuVQWg+I23HoyQPibmIMuwPE05EMXgbEgmhqWoC4BIiPAHEgPsNAIAuIl0PZkUB8G5pn/YCYGYhvQOWsgXgdKGiAqUETPWkwYPEyeqL9Ck2b7FjUT2HCE56d0LCbCMT3gPgtNNmw40puTAQiCJQzCoBYGYgloQXCTTQ1c0CWAhNuJgsJMQ/KZg+BWBTKPwkNhg2wHMBCRtrsh0ZcE7oEQIABAD8mRClb6WrrAAAAAElFTkSuQmCC') 6 12, default"
        ],
        rotationImg = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAATCAYAAAByUDbMAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyRpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoTWFjaW50b3NoKSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo3Q0JGRTFGM0NBNjAxMUU2ODMxNEQwQ0YwOTY4REM4NiIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDo3Q0JGRTFGNENBNjAxMUU2ODMxNEQwQ0YwOTY4REM4NiI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjdDQkZFMUYxQ0E2MDExRTY4MzE0RDBDRjA5NjhEQzg2IiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjdDQkZFMUYyQ0E2MDExRTY4MzE0RDBDRjA5NjhEQzg2Ii8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+iVuSdQAAATBJREFUeNpi/L+UgVRQA8TcQFwJ5kX9h0uwMJAOwoBYF4g1gLgQiB/AJJiINEAIiEOBOBiI+aBiAUB8n2EZYw1MESMBb6oAcScQ+wMxMwEL6/B5cxoQZyLx3wLxVyCWBGJWLOrFcXlzGZJBl4A4FoilgFgeiK+hqb0DxFrAiMjB5rJyII6EsjuhsfYfi7rfQJwONGQ+rtgExVIHlL0ciCuwGLIbiI9D5T4iS6AblowUPtk4gqAUVyCjh5kvUuC/JzUBIhsGiiF+KPsMGYkZxTBQbAlDo38ruYbVQMNoJ1I4ggL4ExDnkWIYC9RAISgGAXYgNoWyZUl1WRMQn8QidxRfzOELsw4scr3kRsAGIJ6DJL4JiNdTEpuTkNgV5MQmcg64DMQzgPgPEF8nxzCAAAMA0+02k9KHdwUAAAAASUVORK5CYII=',
        swapImg = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAD0AAAAOCAYAAACcjBTqAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAblJREFUeNrUVtFtgzAQhaoLeAWvwAqswAp0BP4S0S9WYAU6QjICGYGOQEZwIbpDT682JklR1JNOwPm48/P5nZ0655IH5TDpZ/IP5f2Jf2t5bgVuJ83l/Tzpt7xnk17IN5PxK9iMxLhEbBgD5brknCv9oKocNvhW7rd0k1p5zzyxT2RrxY62LvC/cX7pbjt7I7CYrAE3HhCdgNAcFYxlYhspzqiT9syvC+S0YGvEVv4V6HolRi4+JjA+L0bvmRxOWkEU4FeIrffEN4Gc88Kd3iI8TFc0AU4fV2IoL/PA+BfxrwSO5sTPM/hVEvsjEh/l7OP04U5O1xt9e6gK889CVbGiPeyAlra7+jVQwT5SabV1DNjdAbq+s/HNQAbJMdCElNdIhQrmM0IPwMZoiRKGAA6gKoYBuye6+Va1AmIkXp+ooroDcniq/xDoLRWBnr9LeS79gAHH5FGg3FBKildAjoYaz0C+lpqaAQqNkUa2gK53Bp3DqlvhtILxnavWczb3kfMa82RbQDPwPbZ0S4s3ErjEs+V5wZIAv7m5tjHQKdy9a7lPpztdeY3ola6XL717H3fO9XKwKj8CDACn2z78Hzxs7gAAAABJRU5ErkJggg==',
        swapToolImg = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAARCAYAAADQWvz5AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA2hpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo1NEE1QzM4RUQ0QTZFNDExODhDMUE2NzMxNDcxODYwMSIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDo3Q0JGRTFGMENBNjAxMUU2ODMxNEQwQ0YwOTY4REM4NiIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo3Q0JGRTFFRkNBNjAxMUU2ODMxNEQwQ0YwOTY4REM4NiIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ1M2IChNYWNpbnRvc2gpIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6MDI4MDExNzQwNzIwNjgxMTgwODNEMTZCODk0RkI4OUUiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6NTRBNUMzOEVENEE2RTQxMTg4QzFBNjczMTQ3MTg2MDEiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz4J4z0HAAAA9UlEQVR42mL8v5SBHFAJxB1A/J8h6j9YgImBPJABxDOAmBEmQK5BIJAGxLMYljGCDWMBYmUgNiLREC4onQJ2zDLGFJBBbkA8jQKXJQHxX0q8BgN/gfggIzDW2JGcSiy4BMQyUENigTG3HOS1n1AMA3ZAfIiAQf+ghkQDDVmJLdZCgXgBkd6JBuKV2KI/HIiXAzEzEQYlIBsCAozQlB0JxIuhhjwBYj0Sw+w7C9SJC5FcAgrEd6RmGZDXHIj0Dl4AclE6NKySoGJvgDiLRHMus0CjMgWJ/gbEq4k2Apr7WaDc/9BMyADNMiQD5Oj/D8/RZACAAAMAq+0zsZZPBMEAAAAASUVORK5CYII=',
        deleteToolImg = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAMAAAC6V+0/AAAAWlBMVEUAAACAgICZmZloaGhpaWlnZ2doaGhnZ2dnZ2doaGhnZ2dsbGxycnJ3d3d5eXl6enqAgICCgoKFhYWUlJTHx8fIyMjX19fY2Nji4uLj4+Pr6+vs7Ozz8/P///9sOkhLAAAACnRSTlMAAgVRVYql2dzzxtUjwwAAAJRJREFUeNpt0e0OwiAMBdAOGB11Vp1fE937v6ZQWrMY7j9OQlsKSFyImBLG4OAXP5Fm8krDSLuMg6CZqdylv3gAV+udnizny2MudR2EeuCcudpnLUgBIpmaUQQk06saISRSfW+vZpQaSr0tsyGarUtWRWmkfVk1tpHO1aTbUUaS4ed7saq3gwzfeWZvIf3V9Zfc/Y4vLjUO07wDP3AAAAAASUVORK5CYII=',
        moveImg = 'data:image/png;base64,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';
        // moveImg = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACYAAAAmCAMAAACf4xmcAAABJlBMVEX9lg3////9lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg39lg3dU8yzAAAAYnRSTlMAAAEDBQgJCwwUFhwdHh8jJDAyNDs8PUVJS01OT1VdYGJjZWZoamtzdHV3eHp7fH1+f4KDhZCRlJWWl5qbnJ+goaKkpaiqq6ytrrCxsrW3uLm6u7y+v8DBwsfIysvNztPX2yoanjQAAAF8SURBVHjandRpU4JQFAZgRAlbrLB93zuImVImWpotVkAUpO2L5f//E3mPxNW5Xpzp/cQ788DAPWcQ2ExPdbcIhlW6beuDmW4CmDrDGKUBaNRRxih0DGMVOj5b/UGFztngMdHLQJD0l8h72q5bLBWIKRSLzU3+uylK0iHsMakooQciWYQ5Q1j+y9SbxX5s6WWnm+lX+dYwy0Y+8tc6ZbqZAivRxawOG7MgZaILzr6HOQEDDV0wodqrR/LgEuY2sNRrgI4w9Z4oUNOdpEhJ+UUFdIcRYaaJKiyaNyvMn8HAVFcEKXMySJWzUvvb9svk2rgwSEpVvN3AVAxSKlkpIvw5Z3KUJGFDO3cJLBO2rwhDxzs3VIShc+FpnGXj31BF5c9UPHje7jf6rc+1WM8iyf0XSQ7dNyt8LWU5fotPi8syn821PM8kzKx7bws8Fj3NQZDce5TH9kqUHWc4LJibPyGBZdRRxWfoqGIZdedU8ZkQO2pcouIzTHR9WWT+vb9E4Wns24ZSqgAAAABJRU5ErkJggg==';

    var LOCK_AXIS_THRESHOLD = 10;

    var renderer = layoutController.currentRenderer,
        canvas = renderer.canvas,
        element = layoutController.selectedElements[0],
        mousePos, el, centerPoint, distFromCenter, minRect,
        mousePosInElementSpace, mouseAngle,
        minEyeRadius = 5, maxEyeRadius = 25,
        currentMouseUpHandler,
        that = this,
        lastMousePos,
        lastTargetPos,
        lockedAxis,
        moveIconAlpha = 1,
        currentControl = -1,
        tooltipContainer = null,
        preventTooltip = false;

    var isSnappingOn = true;
    var isContentRotateInProgress = false;
    var isRotateInProgress = false;
    var isContentScaleInProgress = false;
    var isMoveInProgress = false;
    var isResizeInProgress = false;
    var contentSnappingStatus = null;
    var rotateInPlace = false;

    var rotationIcon = new Image();
    rotationIcon.src = rotationImg;

    var swapIcon = new Image();
    swapIcon.src = swapImg;

    var swapToolIcon = new Image();
    swapToolIcon.src = swapToolImg;

    var deleteToolIcon = new Image();
    deleteToolIcon.src = deleteToolImg;

    var moveIcon = new Image();
    moveIcon.src = moveImg;

    this.moveEnabled = true;
    this.swapEnabled = true;
    this.deleteEnabled = false;
    this.rotationInPlaceEnabled = true;
    this.rotationEnabled = true;
    this.minSizeWhenIconsAreVisible = 70;
    this.showBorder = true;

    options = options || {};

    this.onObjectModified = function(options) {
        if (layoutController.selectedElements.length===0) return;

        var scale = renderer.scale,
            canvas = renderer.canvas,
            target = options.target,
            selectionRect = target.getCoordsInModelSpace(),
            selectedElements = layoutController.selectedElements,
            cmd = new PACE.TransformElementsCommand(selectedElements, selectionRect);
        cmd.renderer = renderer;
        cmd.execute();

        layoutController.undoService.pushUndo(cmd);
        layoutController.snappingService.clearSnappedGuides();

        new PACE.PreflightElementCommand(element).execute();
        renderer.render();

        var prev = _.pick(element, 'x', 'y', 'width', 'height');
        var curr = _.pick(element, 'x', 'y', 'width', 'height');
        if (!angular.equals(prev, curr)) {
            renderer.renderWithAnimation();
        }

        layoutController.fireEvent('layout:selection-modified');

        lastMousePos = null;
        lockedAxis = null;
    };

    var dropContainer,
        dropTarget,
        dragMoveHandlers;

    function drawOverlay(canvas, target, opacity) {
        var ctx = canvas.getSelectionContext(),
            matrix = target.getMatrix(),
            mid = matrix.transformPoint(target.width/2, target.height/2);

        ctx.save();
        ctx.setTransform(1,0,0,1,0,0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.translate(target.left, target.top);
        ctx.rotate(target.angle * Math.PI/180);
        ctx.globalAlpha = opacity;
        ctx.fillStyle = settings.swapFillStyle;
        ctx.fillRect(0, 0, target.width * target.scaleX, target.height * target.scaleY);
        ctx.setTransform(1,0,0,1,0,0);
        ctx.drawImage(swapIcon, Math.round(mid.x - swapIcon.width/2), Math.round(mid.y - swapIcon.height/2));
        ctx.restore();
    }

    function getDragMoveHandler(renderer) {

        return function(e) {
            var oldTarget = dropTarget;
            dropTarget = null;
            _.each(renderer.canvas.getObjects(), function(target) {
                if (renderer.canvas.containsPoint(e.e, target)) {
                    if (target && target!==canvas.getActiveObject()) {
                        dropTarget = target;
                        if (target!==oldTarget) {
                            fabric.util.animate({
                                startValue: 0,
                                endValue: 1,
                                duration: 300,
                                onChange: function(value) {
                                    drawOverlay(renderer.canvas, target, value);
                                }
                            });
                        } else {
                            drawOverlay(renderer.canvas, target, 1);
                        }
                    }
                }
            });

            if (!dropTarget && oldTarget) {
                fabric.util.animate({
                    startValue: 1,
                    endValue: 0,
                    duration: 300,
                    onChange: function(value) {
                        drawOverlay(renderer.canvas, oldTarget, value);
                    }
                });
            }
        };
    }

    function onDragStop(e) {
        if (dropTarget && dropTarget!==canvas.getActiveObject()) {
            dropTarget.loaded = false;
            dropTarget.hiResImageLoaded = false;
            canvas.getActiveObject().loaded = false;
            canvas.getActiveObject().hiResImageLoaded = false;

            var cmd = new PACE.SwapContentCommand(element, dropTarget.element);
            layoutController.execCommand(cmd);
            _.each(layoutController.getVisibleRenderers(), function(r) {
                r.render();
            });
            canvas.setActiveObject(dropTarget);

        } else {
            canvas.renderAll();
        }
        document.body.removeChild(dropContainer);
        document.removeEventListener('mouseup', onDragStop);
        dropContainer = null;
        dropTarget = null;
        _.each(dragMoveHandlers, function(handlerInfo) {
            handlerInfo.canvas.off('mouse:move', handlerInfo.handler);
        });
        dragMoveHandlers = [];

        preventTooltip = false;
    }

    this.onMoving = function(options) {
        if (renderer.spread.locked) {
            return;
        }

        var target = options.target,
            rect = target.getCoordsInModelSpace(),
            snappingService = layoutController.snappingService;

        if (currentControl !== 6) {

            //lock the X or Y axis
            if (options.e.shiftKey) {
                var mousePos = {x: options.e.pageX, y: options.e.pageY};
                if (!lastMousePos) lastMousePos = mousePos;

                var dx = Math.abs(lastMousePos.x - mousePos.x),
                    dy = Math.abs(lastMousePos.y - mousePos.y);

                if (dx>dy && dx>LOCK_AXIS_THRESHOLD) {
                    lockedAxis = 'y';
                } else if (dx<dy && dy>LOCK_AXIS_THRESHOLD) {
                    lockedAxis = 'x';
                }
                if (lockedAxis) {
                    rect[lockedAxis] = lastTargetPos[lockedAxis];
                } else {
                    rect = lastTargetPos;
                }
            } else {
                lockedAxis = null;
            }

            var snapped = snappingService.snapObject(rect);
            target.setPositionFromModel(rect);

            lastMousePos = mousePos;
            lastTargetPos = rect;
        }
    };

    this.onObjectRotating = function(options) {
        options.target.angle = snapAngle(normalizeAngle(options.target.angle));
    };

    function drawCorner(ctx, scale) {
        var s15 = 15/scale,
            s5 = 3/scale;

        ctx.strokeStyle = settings.cornerStrokeStyle;
        ctx.fillStyle = settings.cornerFillStyle;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0,0);
        ctx.lineTo(s15, 0);
        ctx.lineTo(s15, s5);
        ctx.lineTo(s5, s5);
        ctx.lineTo(s5, s15);
        ctx.lineTo(0, s15);
        ctx.lineTo(0,0);
        ctx.fill();
        ctx.stroke();
    }

    this.onRender = function() {
        //safe check
        //if active object is not available is means the spread elements have been changed most probably from code
        //so we need to clean up and exit from the editor
        if (!canvas.getActiveObject()) {
            console.error('Reference to activeObject lost - it may cause a bunch of weird shit!!!')
            that.endEdit();
            layoutController.clearSelection();
            return;
        }

        if (!moveIcon.width) {
            moveIcon.onload = this.onRender;
            return;
        }

        if (renderer.spread.locked) {
            return;
        }

        //render controls
        var ctx = canvas.getSelectionContext(),
            activeObject = canvas.getActiveObject(),
            s10 = 10/activeObject.scaleX,
            width = activeObject.width,
            height = activeObject.height,
            matrix = activeObject.getMatrix(),
            mid = matrix.transformPoint(activeObject.width/2, activeObject.height/2),
            radius = getCameraEyeRadius(),
            fullWidth = activeObject.width,
            halfWidth = activeObject.width / 2,
            fullHeight = activeObject.height,
            halfHeight = activeObject.height / 2;

        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        var snappingService = layoutController.snappingService;
        renderer.renderGuides( snappingService.getSnappedGuides() );

        if (that.moveEnabled && radius>minEyeRadius && moveIcon.width) {
            ctx.globalAlpha = moveIconAlpha;
            ctx.drawImage(moveIcon, Math.round(mid.x - moveIcon.width / 2), Math.round(mid.y - moveIcon.height / 2));
        }

        ctx.globalAlpha = 1;

        // content rotate
        if (isContentRotateInProgress) {
            ctx.fillStyle = settings.rotateOrangeStyle;
            var valueBoxPos = matrix.transformPoint(activeObject.width, activeObject.height / 2);
            var valueBox = new fabric.Rect({
                width: 40, height: 30, left: mousePosInElementSpace.x + 10, top: mousePosInElementSpace.y + 10, angle: 0, rx: 3, ry: 3,
                fill: settings.rotateOrangeStyle
            });
            valueBox.render(ctx);

            var rotationValue = normalizeAngle360(activeObject.imageRotation.toFixed(0));
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.font = '13px Arial';
            ctx.fillText(rotationValue + String.fromCharCode(176), mousePosInElementSpace.x + 31, mousePosInElementSpace.y + 30);

            var globalMatrix = activeObject.getGlobalMatrix();
            ctx.setTransform(globalMatrix.a, globalMatrix.b, globalMatrix.c, globalMatrix.d, globalMatrix.tx, globalMatrix.ty);

            // container to clip angled line going outside of frame
            ctx.beginPath();
            ctx.rect(0, 0, fullWidth, fullHeight);
            ctx.clip();

            ctx.strokeStyle = settings.rotateOrangeStyle;
            ctx.lineWidth = 3;

            // horizontal line
            ctx.beginPath();
            ctx.moveTo(halfWidth, halfHeight);
            ctx.lineTo(fullWidth, halfHeight);
            ctx.stroke();

            // angled line
            var horizontalLineLength = fullWidth - halfWidth;
            var verticalLineLength = halfHeight;

            if (horizontalLineLength < 0) {
                horizontalLineLength *= -1;
            }

            if (verticalLineLength < 0) {
                verticalLineLength *= -1;
            }

            var angleLineLength = Math.sqrt(Math.pow(horizontalLineLength, 2) + Math.pow(verticalLineLength, 2));
            var objectRightCenterAngled = {};
            objectRightCenterAngled.x = halfWidth + angleLineLength * Math.cos(Math.PI * rotationValue / 180);
            objectRightCenterAngled.y = halfHeight + angleLineLength * Math.sin(Math.PI * rotationValue / 180);

            ctx.beginPath();
            ctx.moveTo(halfWidth, halfHeight);
            ctx.lineTo(objectRightCenterAngled.x, objectRightCenterAngled.y);
            ctx.stroke();

            // angle arc
            var rotationValueInRadians = rotationValue * Math.PI / 180;
            var anticlockwise = (rotationValue > 0) ? false : true;
            ctx.beginPath();
            ctx.arc(halfWidth, halfHeight, 50, 0, rotationValueInRadians, anticlockwise);
            ctx.stroke();
        }
        // element rotate
        else if (isRotateInProgress) {
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.fillStyle = settings.rotateOrangeStyle;
            var valueBoxPos = matrix.transformPoint(activeObject.width, activeObject.height / 2);
            var valueBox = new fabric.Rect({
                width: 40, height: 30, left: mousePosInElementSpace.x + 10, top: mousePosInElementSpace.y + 10, angle: 0, rx: 3, ry: 3,
                fill: settings.rotateBlueStyle
            });
            valueBox.render(ctx);

            var rotationValue = normalizeAngle360(activeObject.angle.toFixed(0));
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.font = '13px Arial';
            ctx.fillText(rotationValue + String.fromCharCode(176), mousePosInElementSpace.x + 31, mousePosInElementSpace.y + 30);

            var globalMatrix = activeObject.getGlobalMatrix();
            ctx.setTransform(globalMatrix.a, globalMatrix.b, globalMatrix.c, globalMatrix.d, globalMatrix.tx, globalMatrix.ty);

            // container to clip angled line going outside of frame
            ctx.beginPath();
            ctx.rect(0, 0, fullWidth, fullHeight);
            ctx.clip();

            ctx.strokeStyle = settings.rotateBlueStyle;
            ctx.lineWidth = 3;

            // horizontal line - angled from user perspective
            ctx.beginPath();
            ctx.moveTo(halfWidth, halfHeight);
            ctx.lineTo(fullWidth, halfHeight);
            ctx.stroke();

            // angled line - horizontal from user perspective
            var horizontalLineLength = fullWidth - halfWidth;
            var verticalLineLength = halfHeight;

            if (horizontalLineLength < 0) {
                horizontalLineLength *= -1;
            }

            if (verticalLineLength < 0) {
                verticalLineLength *= -1;
            }

            var angleLineLength = Math.sqrt(Math.pow(horizontalLineLength, 2) + Math.pow(verticalLineLength, 2));
            var objectRightCenterAngled = {};
            objectRightCenterAngled.x = halfWidth + angleLineLength * Math.cos(Math.PI * rotationValue / 180);
            objectRightCenterAngled.y = halfHeight + angleLineLength * Math.sin(Math.PI * rotationValue / 180) * -1;

            ctx.beginPath();
            ctx.moveTo(halfWidth, halfHeight);
            ctx.lineTo(objectRightCenterAngled.x, objectRightCenterAngled.y);
            ctx.stroke();

            // angle arc
            var rotationValueInRadians = rotationValue * Math.PI / 180 * -1;
            var anticlockwise = (rotationValue > 0) ? true : false;
            ctx.beginPath();
            ctx.arc(halfWidth, halfHeight, 50, 0, rotationValueInRadians, anticlockwise);
            ctx.stroke();
        }
        // content scale
        else if (isContentScaleInProgress) {
            ctx.fillStyle = settings.scaleOrangeStyle;
            var valueBoxPos = matrix.transformPoint(activeObject.width, activeObject.height / 2);
            var valueBox = new fabric.Rect({
                width: 40, height: 30, left: valueBoxPos.x + 10, top: valueBoxPos.y - 15, angle: 0, rx: 3, ry: 3,
                fill: settings.scaleOrangeStyle
            });
            valueBox.render(ctx);

            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.font = '13px Arial';

            // var effectivePpi = Math.round(72 * activeObject.element.imageFile.width / activeObject.imageWidth);
            // var dpi = activeObject.element.imageFile.dpiX || 300;
            // var scale = dpi / effectivePpi * 100;
            var el = activeObject.element,
                scale = Math.round(Math.min(el.imageWidth / el.width, el.imageHeight / el.height) * 100);

            ctx.fillText(scale.toFixed(0) + '%', valueBoxPos.x + 31, valueBoxPos.y + 5);
        }
        // element move
        else if (isMoveInProgress && layoutController.scope.layout && layoutController.scope.layout.viewState.gridInfoVisible) {
            var objectCoords = activeObject.getCoordsInModelSpace();
            var moveX = parseFloat((objectCoords.x / 72).toFixed(4));
            var moveY = parseFloat((objectCoords.y / 72).toFixed(4));

            var boxWidth = 90;

            if (moveX > 1000 || moveY > 1000 || moveX < -1000 || moveY < -1000) {
                boxWidth = 110;
            } else if (moveX > 100 || moveY > 100 || moveX < -100 || moveY < -100) {
                boxWidth = 104;
            } else if (moveX > 10 || moveY > 10 || moveX < -10 || moveY < -10) {
                boxWidth = 97;
            }

            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.fillStyle = settings.rotateOrangeStyle;
            var valueBox = new fabric.Rect({
                width: boxWidth, height: 46, left: mousePosInElementSpace.x + 10, top: mousePosInElementSpace.y + 10, angle: 0, rx: 3, ry: 3,
                fill: '#b3b3b3'
            });
            valueBox.render(ctx);

            var moveXValue = 'X: ' + moveX + ' in';
            var moveYValue = 'Y: ' + moveY + ' in';

            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'left';
            ctx.font = '13px Arial';
            ctx.fillText(moveXValue, mousePosInElementSpace.x + 18, mousePosInElementSpace.y + 28);
            ctx.fillText(moveYValue, mousePosInElementSpace.x + 18, mousePosInElementSpace.y + 48);
        }
        // element resize
        else if (isResizeInProgress && layoutController.scope.layout && layoutController.scope.layout.viewState.frameInfoVisible) {
            var objectCoords = activeObject.getCoordsInModelSpace();
            var resizeWidth = parseFloat((objectCoords.width / 72).toFixed(4));
            var resizeHeight = parseFloat((objectCoords.height / 72).toFixed(4));

            var boxWidth = 90;

            if (resizeWidth > 1000 || resizeHeight > 1000) {
                boxWidth = 110;
            } else if (resizeWidth > 100 || resizeHeight > 100) {
                boxWidth = 104;
            } else if (resizeWidth > 10 || resizeHeight > 10) {
                boxWidth = 97;
            }

            ctx.fillStyle = settings.rotateOrangeStyle;
            var valueBoxPos = matrix.transformPoint(activeObject.width, activeObject.height);
            var valueBox = new fabric.Rect({
                width: boxWidth, height: 46, left: valueBoxPos.x + 10, top: valueBoxPos.y + 10, angle: 0, rx: 3, ry: 3,
                fill: settings.rotateBlueStyle
            });
            valueBox.render(ctx);

            var resizeWidthValue = 'W: ' + resizeWidth + ' in';
            var resizeHeightValue = 'H: ' + resizeHeight + ' in';

            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'left';
            ctx.font = '13px Arial';
            ctx.fillText(resizeWidthValue, valueBoxPos.x + 18, valueBoxPos.y + 28);
            ctx.fillText(resizeHeightValue, valueBoxPos.x + 18, valueBoxPos.y + 48);
        }
        // content snapping
        else if (contentSnappingStatus) {
            // draw vertical line in frame center
            if (contentSnappingStatus.xSnapping) {
                var p = matrix.transformPoint(activeObject.width / 2, 0);
                ctx.setTransform(1, 0, 0, 1, 0 + 0.5, 0 + 0.5);
                ctx.translate(p.x, p.y);
                ctx.rotate(activeObject.angle * Math.PI/180);

                ctx.strokeStyle = '#FF00FF';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(0,0);
                ctx.lineTo(0, activeObject.height * activeObject.scaleX);
                ctx.stroke();
            }

            // draw horizontal line in frame center
            if (contentSnappingStatus.ySnapping) {
                var p = matrix.transformPoint(0, activeObject.height / 2);
                ctx.setTransform(1, 0, 0, 1,0 + 0.5, 0 + 0.5);
                ctx.translate(p.x, p.y);
                ctx.rotate(activeObject.angle * Math.PI/180);

                ctx.strokeStyle = '#FF00FF';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(0,0);
                ctx.lineTo(fullWidth * activeObject.scaleX, 0);
                ctx.stroke();
            }
        }

        if (isContentScaleControlVisible()) {
            // scale image
            ctx.setTransform(matrix.a, matrix.b, matrix.c, matrix.d, matrix.tx, matrix.ty);
            ctx.translate(width - s10, height - s10);
            ctx.rotate(180 * Math.PI/180);
            drawCorner(ctx, activeObject.scaleX);

            // rotate image
            var p = matrix.transformPoint(8 / activeObject.scaleX, 8 / activeObject.scaleX);
            ctx.setTransform(1,0,0,1,0,0);
            ctx.translate(p.x, p.y);
            ctx.rotate(activeObject.angle * Math.PI/180);
            ctx.drawImage(rotationIcon, 0, 0);

            // swap image
            if (that.swapEnabled) {
                var p = matrix.transformPoint(activeObject.width - (swapToolIcon.width + 8) / activeObject.scaleX, 8 / activeObject.scaleX);
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.translate(p.x, p.y);
                ctx.drawImage(swapToolIcon, 0, 0);
            }

            // delete image
            if (that.deleteEnabled) {
                var p = matrix.transformPoint(activeObject.width - (deleteToolIcon.width/2) / activeObject.scaleX, (-deleteToolIcon.height/2) / activeObject.scaleX);
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.translate(Math.round(p.x), Math.round(p.y));
                ctx.drawImage(deleteToolIcon, 0, 0);
            }
        }

        ctx.restore();
    };

    function getCameraEyeRadius() {
        var activeObject = canvas.getActiveObjectOrGroup(),
            width = activeObject.width,
            height = activeObject.height,
            s = activeObject.scaleX,
            radius = Math.min(maxEyeRadius, Math.min(width * s, height * s) * 0.2);
        return radius;
    }

    function isContentScaleControlVisible() {
        var activeObject = canvas.getActiveObjectOrGroup(),
            s = activeObject.scaleX,
            width = activeObject.width * s,
            height = activeObject.height * s,
            minSize = that.minSizeWhenIconsAreVisible;
        return (width>minSize && height>minSize);
    }

    function getCenter(element) {
        var matrix = new PACE.Element(element).getMatrix(),
            center = matrix.transformPoint(element.width/2, element.height/2);
        return center;
    }

    function getPointerInElementSpace(e) {
        var pos = canvas.getPointer(e),
            matrix = new PACE.Element(element).getMatrix(),
            pointerInModelSpace = new PACE.Point(pos.x, pos.y).toModelSpace(canvas);

        matrix.invert();
        return matrix.transformPoint(pointerInModelSpace.x, pointerInModelSpace.y);
    }

    function getPointerInModelSpace(e) {
        var pos = canvas.getPointer(e),
            pointerInModelSpace = new PACE.Point(pos.x, pos.y).toModelSpace(canvas);

        return pointerInModelSpace;
    }

    function getMouseAngle(e) {
        var pointerInModelSpace = getPointerInModelSpace(e),
            center = getCenter(element);

        var offset = { x: pointerInModelSpace.x - center.x, y: pointerInModelSpace.y - center.y };
        return normalizeAngle((Math.atan2(offset.y, offset.x) * 180/Math.PI));
    }

    function normalizeAngle(angle) {
        while (angle >  180) angle -= 360;
        while (angle < -180) angle += 360;
        return angle;
    }

    function normalizeAngle360(angle) {
        if (angle < 0) {
            angle = parseInt(angle, 10) + 360;
        }

        return angle;
    }

    function snapAngle(angle) {
        if (isSnappingOn && that.rotationInPlaceEnabled && that.snapFrameToAngles) {
            var minDist = Number.MAX_VALUE,
                snappedAngle;
            for (var i = 0; i < that.snapFrameToAngles.length; i++) {
                var d = Math.abs(angle - normalizeAngle(that.snapFrameToAngles[i]));
                if (d<5) {
                    return that.snapFrameToAngles[i];
                }
            }
            return angle;
        }

        var r = Math.round(angle/45) * 45;
        if (isSnappingOn && Math.abs(angle - r)<=3) {
            return r;
        }
        return angle;
    }

    function shouldAllowMovingContent(element) {
        return true;
        //return (Math.abs(element.imageWidth - element.width)>2 ||
        //    Math.abs(element.imageHeight - element.height)>2);
    }

    function findControl(e) {
        if (renderer.spread.locked) {
            return -1;
        }

        var matrix = new PACE.Element(element).getMatrix(),
            pointer = canvas.getPointer(e),
            pointerInModelSpace = new PACE.Point(pointer.x, pointer.y).toModelSpace(canvas),
            center = matrix.transformPoint(element.width/2, element.height/2),
            radius = getCameraEyeRadius();

        if (that.moveEnabled && PACE.Point.distance(center, pointerInModelSpace) <= radius / canvas.scale) {
            return 'center';
        }

        matrix.invert();
        var pointerInElementSpace = matrix.transformPoint(pointerInModelSpace.x, pointerInModelSpace.y);

        var s18 = 18 / canvas.scale,
            s8 = 8 / canvas.scale,
            s12 = 12 / canvas.scale,
            s16 = 16 / canvas.scale,
            width = element.width,
            height = element.height,
            coords = [
                //top left corner
                [s18, s18],
                //bottom right corner
                [width - s18, height - s18],

                //rotation hot rects
                [-s12, -s12],
                //[width + s12, -s12],
                [Number.MAX_VALUE, Number.MAX_VALUE],
                
                [width + s12, height + s12],
                [-s12, height + s12],

                // top right control
                [width - s18, s18],
                
                // top right control - delete
                [width, 0]
            ],
            n = coords.length;

        for (var i = 0; i < n; i++) {
            if ((i < 2 && !isContentScaleControlVisible())) {
                continue;
            }

            if (i === 6 && !that.swapEnabled) {
                continue;
            }

            if (i === 7 && !that.deleteEnabled) {
                continue;
            }

            if (i>=2 && i<=5 && !that.rotationEnabled) {
                continue;
            }

            var r = new PACE.Rect({ x:coords[i][0] - s8, y:coords[i][1] - s8, width:s16, height:s16 });
            if (r.containsPoint(pointerInElementSpace.x, pointerInElementSpace.y)) {
                return i;
            }

            //debugging
            /*
            matrix = new PACE.Element(element).getMatrix();
            var pt = matrix.transformPoint(r.x, r.y),
                ctx = canvas.getSelectionContext();

            pt = new PACE.Point(pt.x, pt.y).toCanvasSpace(canvas);
            ctx.fillStyle = '#0000ff';
            ctx.fillRect(pt.x, pt.y, 16, 16);
            */
        }
        return -1;

    }

    function isOverActiveElement(e) {
        if (renderer.spread.locked) {
            return -1;
        }

        var matrix = new PACE.Element(element).getMatrix();
        var pointer = canvas.getPointer(e);
        var pointerInModelSpace = new PACE.Point(pointer.x, pointer.y).toModelSpace(canvas);

        matrix.invert();

        var pointerInElementSpace = matrix.transformPoint(pointerInModelSpace.x, pointerInModelSpace.y);
        var width = element.width;
        var height = element.height;

        var r = new PACE.Rect({
            x: 0,
            y: 0,
            width: width,
            height: height
        });

        if (r.containsPoint(pointerInElementSpace.x, pointerInElementSpace.y)) {
            return true;
        }

        return false;
    }

    function checkMinMax(element) {
        var bleed = options.bleed || 0;
        new PACE.FixContentInFrame(element, bleed).execute();
    }

    function isContentEqualToFrame(element) {
        if (element.height.toFixed(2) === element.imageHeight.toFixed(2) && element.width.toFixed(2) === element.imageWidth.toFixed(2)) {
            return true;
        } else {
            return false;
        }
    }

    function onCanvasMouseMove(e) {
        var control = findControl(e);

        if (isMoveInProgress) {
            var pointer = canvas.getPointer(e);
            mousePosInElementSpace = pointer;
        }

        if (currentControl === 6) {
            $(dropContainer).offset({left: e.pageX, top: e.pageY});
        }

        updateTooltip(e, control);

        if (canvas.preventMouseDown)
            return;

        var activeObject = canvas.getActiveObjectOrGroup();
        var isOverActiveObject = isOverActiveElement(e);

        if (isOverActiveObject && control === -1) {
            if (isContentEqualToFrame(activeObject)) {
                canvas.defaultCursor = 'default';
                canvas.hoverCursor = 'default';
            } else {
                canvas.defaultCursor = 'url(/images/hand-tool.png) 9 9, auto';
                canvas.hoverCursor = 'url(/images/hand-tool.png) 9 9, auto';
            }
        } else if (control === 'center') {
            canvas.defaultCursor = 'move';
            canvas.hoverCursor = 'move';
        } else if (control === 7) {
            canvas.defaultCursor = 'default';
            canvas.hoverCursor = 'default';
        } else if (control > 1 && control !== 6) {
            var idx = Math.round(element.rotation / 90),
                cursors = activeObject.showCroppedImage ? contentRotateCursors : frameRotateCursors;
            canvas.defaultCursor = cursors[((control - 2) + idx) % 4];
            canvas.hoverCursor = cursors[((control - 2) + idx) % 4];
        } else {
            canvas.defaultCursor = 'default';
            canvas.hoverCursor = 'default';
        }
    }

    function onCanvasMouseUp(e) {
        isMoveInProgress = false;
        isResizeInProgress = false;
        preventTooltip = false;
        canvas.renderAll();
    }

    function showMoveIcon(show) {
        fabric.util.animate({
            startValue: 0,
            endValue: 1,
            duration: 300,
            onChange: function(value) {
                moveIconAlpha = (show ? 1 - value : value);
                canvas.renderAll();
            },
        });
    }

    function onBeforeMouseDown(e) {
        if (renderer.spread.locked) {
            currentControl = -1;
            return;
        }

        var activeObject = canvas.getActiveObjectOrGroup(),
            control = findControl(e),
            mouseTarget = canvas.findTarget(e);

        preventTooltip = true;
        updateTooltip(e, control);

        if (mouseTarget && mouseTarget !== activeObject) {
            if (control==='center' && mouseTarget.selectable) {
                //fake findTarget fn to make canvas ignore the object placed over the move icon
                var fn = canvas.findTarget;
                canvas.findTarget = function() { return activeObject; };

                setTimeout(function() {
                    canvas.findTarget = fn;
                });
            } else {
                return;
            }
        }

        mousePosInElementSpace = getPointerInElementSpace(e);
        activeObject.forceCorner = false;

        var dist = 4 / canvas.scale;
        
        if (control === -1 && mousePosInElementSpace.x >= dist &&
            mousePosInElementSpace.x <= element.width - dist &&
            mousePosInElementSpace.y >= dist &&
            mousePosInElementSpace.y <= element.height - dist) {
            control = 'center';
        } else if (control === 'center') {
            control = -1;
        }

        if (control === 'center' || (control === 1)) {
            var center = new PACE.Element(element).getMatrix()
                        .transformPoint(element.width / 2, element.height / 2);

            centerPoint = (new PACE.Point(center.x, center.y)).toCanvasSpace(canvas);

            mousePos = canvas.getPointer(e);
            distFromCenter = PACE.Point.distance(centerPoint, mousePos);
            minRect = checkMinMax(element);
            el = _.pick(element, 'x', 'y', 'width', 'height', 'imageX', 'imageY', 'imageWidth', 'imageHeight');
            mousePosInElementSpace = getPointerInElementSpace(e);

            canvas.preventMouseDown = true;
            activeObject.showCroppedImage = true;

            if (control==='center') {
                document.addEventListener('mousemove', onContentMoveMouseMove);
                document.addEventListener('mouseup', onContentMoveMouseUp);
            } else {
                isContentScaleInProgress = true;
                document.addEventListener('mousemove', onContentScaleMouseMove);
                document.addEventListener('mouseup', onContentScaleMouseUp);
            }
            canvas.renderAll();
        } else if (control === 6) {
            canvas.preventMouseDown = true;

            if (!dropContainer) {
                dropContainer = document.createElement('div');
                dropContainer.className = 'drop-container';
                var img = document.createElement('img');
                img.src = activeObject.image.src;
                dropContainer.appendChild(img);
                document.body.appendChild(dropContainer);
                $(dropContainer)
                    .offset({left: e.pageX, top: e.pageY})
                    .css({'pointer-events': 'none'})
                    .css('z-index', 1000);

                dragMoveHandlers = [];
                _.each(layoutController.getVisibleRenderers(), function(r) {
                    var handler = getDragMoveHandler(r);
                    r.canvas.on('mouse:move', handler);
                    dragMoveHandlers.push( {canvas:r.canvas, handler:handler} );
                });
                document.addEventListener('mouseup', onDragStop);
            }
        } else if (control === 7) {
            if (that.onDeleteClick) {
                canvas.preventMouseDown = true;
                that.onDeleteClick(e);
                return;
            }
        } else if (control === 0 || control > 1) {
            //rotate
            //action = 'rotate';
            isSnappingOn = !e.shiftKey;
            if (control===0) {
                //rotate content
                rotateInPlace = false;
                el = _.pick(element, 'x', 'y', 'rotation', 'imageRotation', 'imageX', 'imageY', 'imageWidth', 'imageHeight');
                mouseAngle = getMouseAngle(e);
                canvas.preventMouseDown = true;
                document.addEventListener('mousemove', onContentRotateMouseMove);
                document.addEventListener('mouseup', onContentRotateMouseUp);
                activeObject.showCroppedImage = true;
                canvas.renderAll();
                showMoveIcon(true);
            } else {
                if (that.rotationInPlaceEnabled) {
                    rotateInPlace = true;
                    el = _.pick(element, 'x', 'y', 'rotation', 'imageRotation', 'imageX', 'imageY', 'imageWidth', 'imageHeight');
                    mouseAngle = getMouseAngle(e);
                    canvas.preventMouseDown = true;
                    document.addEventListener('mousemove', onContentRotateMouseMove);
                    document.addEventListener('mouseup', onContentRotateMouseUp);
                    activeObject.showCroppedImage = true;
                    canvas.renderAll();
                    showMoveIcon(true);
                } else {
                    //rotate bounding frame
                    document.addEventListener('mousemove', onRotateMouseMove);
                    document.addEventListener('mouseup', onRotateMouseUp);
                    isRotateInProgress = true;
                    canvas.preventMouseDown = true;
                    activeObject.forceCorner = 'mtr';
                    canvas._beforeTransform(e, activeObject);
                    canvas._setupCurrentTransform(e, activeObject);
                    showMoveIcon(true);
                }
            }
        } else {
            //let fabric do the rest
            //force uniscaling when dragging middle anchors
            document.addEventListener('mouseup', onScaleMouseUp);

            var pointer = canvas.getPointer(e);
            var targetCorner = activeObject._findTargetCorner(pointer),
                middleCorners = { 'mt':'tr', 'mr':'br', 'mb':'br', 'ml':'bl' },
                corner = middleCorners[targetCorner];

            if (!targetCorner && !corner) {
                isMoveInProgress = true;
                mousePosInElementSpace = pointer;
            } else {
                isResizeInProgress = true;
            }

            if (targetCorner) {
                activeObject.lockUniScaling = true;
            }
            if (corner) {
                activeObject.forceCorner = corner;
                activeObject.centeredScaling = true;
            } else {
                activeObject.centeredScaling = false;
            }

            canvas.preventMouseDown = false;
            activeObject.showCroppedImage = false;
            canvas.renderAll();
        }

        lastMousePos = {x: e.pageX, y: e.pageY};
        var activeObject = canvas.getActiveObjectOrGroup();
        if (activeObject) {
            lastTargetPos = activeObject.getCoordsInModelSpace();
        }

        currentControl = control;
    }

    /* -------------- content rotation ------------ */
    function onContentRotateMouseMove(e) {
        e.stopPropagation();
        var pointer = canvas.getPointer(e);
        mousePosInElementSpace = pointer;

        if (rotateInPlace) {
            isRotateInProgress = true;
        } else {
            isContentRotateInProgress = true;
        }

        isSnappingOn = !e.shiftKey;
        var angle = getMouseAngle(e) - mouseAngle;
        _.extend(element, el);

        //normalize and snap
        if (rotateInPlace) {
            angle = snapAngle(normalizeAngle(element.rotation + angle)) - element.rotation;
        } else {
            angle = snapAngle(normalizeAngle(element.imageRotation + angle)) - element.imageRotation;
        }

        if (rotateInPlace) {
            new PACE.RotateContentCommand(element, element.imageRotation - angle).execute();
            new PACE.RotateElementCommand(element, element.rotation + angle).execute();
        } else {
            new PACE.RotateContentCommand(element, element.imageRotation + angle).execute();
        }

        new PACE.PreflightElementCommand(element).execute();
        renderer.renderElement(element);
        layoutController.fireEvent('layout:selection-modifying', element);
    }

    function onContentRotateMouseUp(e) {
        e.stopPropagation();
        document.removeEventListener('mousemove', onContentRotateMouseMove);
        document.removeEventListener('mouseup', onContentRotateMouseUp);

        isContentRotateInProgress = false;
        isRotateInProgress = false;

        var activeObject = canvas.getActiveObjectOrGroup();
        if (activeObject) {
            activeObject.forceCorner = false;
            activeObject.showCroppedImage = false;
        }

        if (that.rotationInPlaceEnabled && that.snapFrameToAngles) {
            var minDist = Number.MAX_VALUE,
                angle;
            for (var i = 0; i < that.snapFrameToAngles.length; i++) {
                var d = Math.abs(normalizeAngle(element.rotation) - normalizeAngle(that.snapFrameToAngles[i]));
                if (d<minDist) {
                    minDist = d;
                    angle = that.snapFrameToAngles[i];
                }
            }

            angle = angle - element.rotation;

            new PACE.RotateContentCommand(element, element.imageRotation - angle).execute();
            new PACE.RotateElementCommand(element, element.rotation + angle).execute();

            renderer.render();
        } else {
            canvas.renderAll();
        }

        canvas.preventMouseDown = false;

        var cmd = new PACE.TransformElementCommand(element,
            _.pick(element, 'x', 'y', 'rotation', 'imageX', 'imageY', 'imageWidth', 'imageHeight', 'imageRotation'), el);
        cmd.renderer = renderer;
        layoutController.undoService.pushUndo(cmd);

        layoutController.fireEvent('layout:selection-modified');
        layoutController.fireEvent('layout:layout-changed');

        showMoveIcon(false);
    }

    /* ------ content scaling stuff  -------- */
    function onContentScaleMouseMove(e) {
        e.stopPropagation();
        var pos = canvas.getPointer(e),
            dist = PACE.Point.distance(centerPoint, pos),
            scale = dist/distFromCenter;

        _.extend(element, el);
       
        var contentMatrix = new PACE.Matrix2D();
        contentMatrix.rotate(element.imageRotation * Math.PI/180);
        contentMatrix.translate(element.imageX, element.imageY);
        contentMatrix.invert();

        //calculate bounding frame center in content space
        var center = contentMatrix.transformPoint(element.width/2, element.height/2);

        //scale around bounding frame center
        contentMatrix = new PACE.Matrix2D();
        contentMatrix.translate(-center.x, -center.y);
        contentMatrix.scale(scale, scale);
        contentMatrix.translate(center.x, center.y);

        //apply existing content tranformation
        contentMatrix.rotate(element.imageRotation * Math.PI/180);
        contentMatrix.translate(element.imageX, element.imageY);

        var p = contentMatrix.transformPoint(0,0);
        element.imageX = p.x;
        element.imageY = p.y;
        element.imageWidth = element.imageWidth * scale;
        element.imageHeight = element.imageHeight * scale;
        
        //this will fix the content when it becomes smaller than the frame
        new PACE.RotateContentCommand(element, element.imageRotation).execute();

        new PACE.PreflightElementCommand(element).execute();

        renderer.renderElement(element);
        layoutController.fireEvent('layout:selection-modifying', element);
    }

    function onContentScaleMouseUp(e) {
        e.stopPropagation();
        document.removeEventListener('mousemove', onContentScaleMouseMove);
        document.removeEventListener('mouseup', onContentScaleMouseUp);

        isContentScaleInProgress = false;

        var activeObject = canvas.getActiveObjectOrGroup();
        if (activeObject)
            activeObject.showCroppedImage = false;

        canvas.renderAll();
        canvas.preventMouseDown = false;

        var cmd = new PACE.TransformElementCommand(element,
            _.pick(element, 'imageX', 'imageY', 'imageWidth', 'imageHeight'), el);
        cmd.renderer = renderer;
        layoutController.undoService.pushUndo(cmd);

        layoutController.fireEvent('layout:selection-modified');
        layoutController.fireEvent('layout:layout-changed');
    }

    /* ------ content movement stuff  -------- */
    function onContentMoveMouseMove(e) {
        e.stopPropagation();
        var pos = getPointerInElementSpace(e),
            dx = pos.x - mousePosInElementSpace.x,
            dy = pos.y - mousePosInElementSpace.y;

        _.extend(element, el);
        element.imageX += dx;
        element.imageY += dy;

        contentSnappingStatus = new PACE.SnapContentInFrame(element).execute();
        checkMinMax(element);

        renderer.renderElement(element);
        layoutController.fireEvent('layout:selection-modifying', element);
    }

    function onContentMoveMouseUp(e) {
        e.stopPropagation();
        document.removeEventListener('mousemove', onContentMoveMouseMove);
        document.removeEventListener('mouseup', onContentMoveMouseUp);

        contentSnappingStatus = null;

        var activeObject = canvas.getActiveObjectOrGroup();
        if (activeObject)
            activeObject.showCroppedImage = false;
        canvas.renderAll();
        canvas.preventMouseDown = false;

        var cmd = new PACE.TransformElementCommand(element,
            _.pick(element, 'imageX', 'imageY', 'imageWidth', 'imageHeight'), el);
        cmd.renderer = renderer;
        layoutController.undoService.pushUndo(cmd);

        layoutController.fireEvent('layout:selection-modified');
        layoutController.fireEvent('layout:layout-changed');
    }

    function onRotateMouseMove(e) {
        e.stopPropagation();
        isSnappingOn = !e.shiftKey;
        var pointer = canvas.getPointer(e);
        mousePosInElementSpace = pointer;
    }

    function onRotateMouseUp(e) {
        e.stopPropagation();
        document.removeEventListener('mousemove', onRotateMouseMove);
        document.removeEventListener('mouseup', onRotateMouseUp);
        isRotateInProgress = false;

        var activeObject = canvas.getActiveObjectOrGroup();
        if (activeObject)
            activeObject.forceCorner = false;
        canvas.__onMouseUp(e);
        canvas.preventMouseDown = false;

        showMoveIcon(false);
    }

    function onScaleMouseUp(e) {
        e.stopPropagation();
        document.removeEventListener('mouseup', onScaleMouseUp);
        var activeObject = canvas.getActiveObjectOrGroup();
        if (activeObject) {
            activeObject.forceCorner = false;
            activeObject.lockUniScaling = false;
        }
        canvas.preventMouseDown = false;
    }

    var hasBorders;

    this.beginEdit = function() {
        var activeObject = canvas.getActiveObjectOrGroup();
        activeObject.lockUniScaling = false;
        hasBorders = activeObject.hasBorders;
        activeObject.hasBorders = this.showBorder;

        canvas.snappingService = layoutController.snappingService;
        canvas.on('object:modified', this.onObjectModified);
        canvas.on('object:moving', this.onMoving);
        canvas.on('object:rotating', this.onObjectRotating);
        canvas.on('after:render', this.onRender);
        canvas.on('before:mousedown', onBeforeMouseDown);

        canvas.upperCanvasEl.addEventListener('mousemove', onCanvasMouseMove);
        canvas.upperCanvasEl.addEventListener('mouseup', onCanvasMouseUp);

        layoutController.snappingService.beginSnapping(layoutController);
        canvas.renderAll();
        canvas.calcOffset();

        createTooltip();
        //console.log('ImageEditor - beginEdit');
    };

    this.endEdit = function() {
        var activeObject = canvas.getActiveObjectOrGroup();
        if (canvas._currentTransform && canvas._currentTransform.target===activeObject) {
            this.onObjectModified({target:activeObject});
        }

        isSnappingOn = true;
        canvas.snappingService = undefined;
        canvas.off('object:modified', this.onObjectModified);
        canvas.off('object:moving', this.onMoving);
        canvas.off('object:rotating', this.onObjectRotating);
        canvas.off('after:render', this.onRender);
        canvas.off('before:mousedown', onBeforeMouseDown);
        canvas.upperCanvasEl.removeEventListener('mousemove', onCanvasMouseMove);
        canvas.upperCanvasEl.removeEventListener('mouseup', onCanvasMouseUp);

        document.removeEventListener('mousemove', onContentMoveMouseMove);
        document.removeEventListener('mouseup', onContentMoveMouseUp);

        document.removeEventListener('mousemove', onContentRotateMouseMove);
        document.removeEventListener('mouseup', onContentRotateMouseUp);

        document.removeEventListener('mousemove', onRotateMouseMove);
        document.removeEventListener('mouseup', onRotateMouseUp);
        document.removeEventListener('mouseup', onScaleMouseUp);

        var activeObject = canvas.getActiveObjectOrGroup();
        if (activeObject) {
            activeObject.hasBorders = hasBorders;
            activeObject.forceCorner = false;
        }

        canvas.preventMouseDown = false;
        layoutController.snappingService.endSnapping();

        canvas.getSelectionContext().clearRect(0,0,canvas.width, canvas.height);

        removeTooltip();
        //console.log('ImageEditor - endEdit');
    };

    function createTooltip() {
        if (!tooltipContainer) {
            tooltipContainer = document.createElement('div');
            tooltipContainer.className = 'tooltip-container hidden-force';
            document.body.appendChild(tooltipContainer);
        }
    }

    function removeTooltip() {
        if (tooltipContainer) {
            document.body.removeChild(tooltipContainer);
            tooltipContainer = null;
        }
    }

    function updateTooltip(e, control) {
        var tooltipText = null;

        if (!preventTooltip) {
            if (control === 0) {
                tooltipText = 'Rotate Image';
            } else if (control === 1) {
                tooltipText = 'Scale Image';
            } else if (control === 6) {
                tooltipText = 'Swap Image';
            } else if (control === 'center') {
                tooltipText = 'Move Frame';
            } else if (control === 7) {
                tooltipText = 'Delete Image';
            }

            if (that.rotationInPlaceEnabled && control>1 && control<6) {
                tooltipText = 'Change Orientation';
            }
            // else if (control > 1 && control < 6) {
            //     tooltipText = null;
            // }
        }

        if (tooltipText) {
            $(tooltipContainer)
                .removeClass('hidden-force')
                .text(tooltipText)
                .offset({
                    left: e.pageX + 10,
                    top: e.pageY + 10
                });
        } else {
            $(tooltipContainer).addClass('hidden-force');
        }
    }

};
