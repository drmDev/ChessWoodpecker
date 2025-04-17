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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorBoundary = void 0;
var react_1 = __importStar(require("react"));
var react_native_1 = require("react-native");
/**
 * Error boundary component to catch and display errors in the UI
 * This helps prevent the app from crashing completely and provides
 * useful debugging information
 */
var ErrorBoundary = /** @class */ (function (_super) {
    __extends(ErrorBoundary, _super);
    function ErrorBoundary(props) {
        var _this = _super.call(this, props) || this;
        _this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
        return _this;
    }
    ErrorBoundary.getDerivedStateFromError = function (error) {
        // Update state so the next render will show the fallback UI
        return {
            hasError: true,
            error: error,
            errorInfo: null
        };
    };
    ErrorBoundary.prototype.componentDidCatch = function (error, errorInfo) {
        // Log the error to the console
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({
            error: error,
            errorInfo: errorInfo
        });
    };
    ErrorBoundary.prototype.render = function () {
        var _a, _b;
        if (this.state.hasError) {
            // Render error information
            return (<react_native_1.View style={styles.container}>
          <react_native_1.Text style={styles.header}>Something went wrong</react_native_1.Text>
          <react_native_1.ScrollView style={styles.scrollView}>
            <react_native_1.Text style={styles.errorText}>
              {(_a = this.state.error) === null || _a === void 0 ? void 0 : _a.toString()}
            </react_native_1.Text>
            <react_native_1.Text style={styles.stackText}>
              {((_b = this.state.errorInfo) === null || _b === void 0 ? void 0 : _b.componentStack) || 'No component stack available'}
            </react_native_1.Text>
          </react_native_1.ScrollView>
        </react_native_1.View>);
        }
        // If no error, render children normally
        return this.props.children;
    };
    return ErrorBoundary;
}(react_1.Component));
exports.ErrorBoundary = ErrorBoundary;
var styles = react_native_1.StyleSheet.create({
    container: {
        backgroundColor: '#f8d7da',
        borderColor: '#f5c6cb',
        borderWidth: 1,
        flex: 1,
        padding: 20,
    },
    errorText: {
        color: '#721c24',
        fontSize: 16,
        marginBottom: 10,
    },
    header: {
        color: '#721c24',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    scrollView: {
        flex: 1,
    },
    stackText: {
        color: '#721c24',
        fontFamily: 'monospace',
        fontSize: 14,
    },
});
exports.default = ErrorBoundary;
