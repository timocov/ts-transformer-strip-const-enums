"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.doSomething = exports.ExportedEnum = exports.ExportedConstEnum = void 0;
;
var ExportedConstEnum;
(function (ExportedConstEnum) {
    ExportedConstEnum[ExportedConstEnum["First"] = 0] = "First";
})(ExportedConstEnum || (exports.ExportedConstEnum = ExportedConstEnum = {}));
var NonExportedEnum;
(function (NonExportedEnum) {
    NonExportedEnum[NonExportedEnum["First"] = 0] = "First";
})(NonExportedEnum || (NonExportedEnum = {}));
var ExportedEnum;
(function (ExportedEnum) {
    ExportedEnum[ExportedEnum["First"] = 0] = "First";
})(ExportedEnum || (exports.ExportedEnum = ExportedEnum = {}));
function doSomething() {
    console.log(0 /* NonExportedConstEnum.First */, 0 /* ExportedConstEnum.First */, NonExportedEnum.First, ExportedEnum.First);
}
exports.doSomething = doSomething;
