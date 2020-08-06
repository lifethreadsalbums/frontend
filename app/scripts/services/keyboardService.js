'use strict';

angular.module('paceApp')
.factory('KeyboardService', [function () {

    var keyCodes = {};

    keyCodes[49] = "1";
    keyCodes[50] = "2";
    keyCodes[51] = "3";
    keyCodes[52] = "4";
    keyCodes[53] = "5";
    keyCodes[54] = "6";
    keyCodes[55] = "7";
    keyCodes[56] = "8";
    keyCodes[57] = "9";
    keyCodes[48] = "0";
    keyCodes[189] = "-";
    keyCodes[187] = "=";
    keyCodes[173] = '-';
    keyCodes[61] = "=";
    keyCodes[81] = "Q";
    keyCodes[87] = "W";
    keyCodes[69] = "E";
    keyCodes[82] = "R";
    keyCodes[84] = "T";
    keyCodes[89] = "Y";
    keyCodes[85] = "U";
    keyCodes[73] = "I";
    keyCodes[79] = "O";
    keyCodes[80] = "P";
    keyCodes[219] = "[";
    keyCodes[221] = "]";
    keyCodes[65] = "A";
    keyCodes[83] = "S";
    keyCodes[68] = "D";
    keyCodes[70] = "F";
    keyCodes[71] = "G";
    keyCodes[72] = "H";
    keyCodes[74] = "J";
    keyCodes[75] = "K";
    keyCodes[76] = "L";
    keyCodes[186] = ";";
    keyCodes[222] = "'";
    keyCodes[220] = "\\";
    keyCodes[192] = "`";
    keyCodes[90] = "Z";
    keyCodes[88] = "X";
    keyCodes[67] = "C";
    keyCodes[86] = "V";
    keyCodes[66] = "B";
    keyCodes[78] = "N";
    keyCodes[77] = "M";
    keyCodes[188] = ",";
    keyCodes[190] = ".";
    keyCodes[191] = "/";
    keyCodes[8] = "BACKSPACE";
    keyCodes[46] = "DELETE";
    keyCodes[37] = "LEFT";
    keyCodes[39] = "RIGHT";
    keyCodes[38] = "UP";
    keyCodes[40] = "DOWN";
    keyCodes[45] = "INSERT";
    keyCodes[27] = "ESCAPE";
    keyCodes[13] = "ENTER";
    keyCodes[32] = "SPACE";
    keyCodes[34] = "PAGEDOWN";
    keyCodes[33] = "PAGEUP";
    
    //numeric keypad keys
    keyCodes[96] = "0";
    keyCodes[97] = "1";
    keyCodes[98] = "2";
    keyCodes[99] = "3";
    keyCodes[100] = "4";
    keyCodes[101] = "5";
    keyCodes[102] = "6";
    keyCodes[103] = "7";
    keyCodes[104] = "8";
    keyCodes[105] = "9";
    keyCodes[106] = "*";
    keyCodes[107] = "+";
    keyCodes[109] = "-";
    keyCodes[110] = ".";
    keyCodes[111] = "/";
        
    return {
        getShortcut: function(e) {
            var keys = [];
            if (e.ctrlKey || e.metaKey)
                keys.push("CTRL");
            if (e.altKey)
                keys.push("ALT");
            if (e.shiftKey)
                keys.push("SHIFT");
            
            var char = keyCodes[e.keyCode];
            keys.push(char);
            if (char)
                return keys.join("+");
            
            return null;
        }
    };

}]);