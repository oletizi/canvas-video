"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
exports.Audiator = exports.MyProcessor = void 0;
var MyProcessor = /** @class */ (function (_super) {
    __extends(MyProcessor, _super);
    function MyProcessor() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    MyProcessor.prototype.process = function (inputs, outputs) {
        // Custom audio processing logic here
        // Access input data from 'inputs' and modify it, then write to 'outputs'
        return true;
    };
    return MyProcessor;
}(AudioWorkletProcessor));
exports.MyProcessor = MyProcessor;
var Audiator = /** @class */ (function () {
    function Audiator(audioContext) {
        this.audioContext = audioContext;
        this.osc = audioContext.createOscillator();
        this.osc.type = 'sine';
        this.osc.frequency.value = 440;
        this.osc.connect(audioContext.destination);
    }
    Audiator.prototype.play = function () {
        this.osc.start(this.audioContext.currentTime);
    };
    Audiator.prototype.pause = function () {
        this.osc.stop(this.audioContext.currentTime);
    };
    return Audiator;
}());
exports.Audiator = Audiator;
