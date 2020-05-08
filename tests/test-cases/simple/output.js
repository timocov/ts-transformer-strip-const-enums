"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
;
var ExportedConstEnum;
(function (ExportedConstEnum) {
    ExportedConstEnum[ExportedConstEnum["First"] = 0] = "First";
})(ExportedConstEnum = exports.ExportedConstEnum || (exports.ExportedConstEnum = {}));
var NonExportedEnum;
(function (NonExportedEnum) {
    NonExportedEnum[NonExportedEnum["First"] = 0] = "First";
})(NonExportedEnum || (NonExportedEnum = {}));
var ExportedEnum;
(function (ExportedEnum) {
    ExportedEnum[ExportedEnum["First"] = 0] = "First";
})(ExportedEnum = exports.ExportedEnum || (exports.ExportedEnum = {}));
function doSomething() {
    console.log(0 /* First */, 0 /* First */, NonExportedEnum.First, ExportedEnum.First);
}
exports.doSomething = doSomething;
