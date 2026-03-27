"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var Router = /** @class */ (function () {
    function Router() {
        this.contentContainer = null;
        this.contentContainer = document.querySelector('.container');
        this.initNavigationHandlers();
    }
    Router.prototype.initNavigationHandlers = function () {
        var _this = this;
        // Intercept all clicks on navigation links
        document.addEventListener('click', function (e) {
            var target = e.target;
            var link = target.closest('a[href]');
            if (link && link.id === 'logout') {
                return;
            }
            if (link && _this.isInternalLink(link)) {
                e.preventDefault();
                var url = link.getAttribute('href');
                if (url) {
                    _this.navigate(url);
                }
            }
        });
        // Handle browser back/forward buttons
        window.addEventListener('popstate', function () {
            _this.loadPage(window.location.pathname, false);
        });
    };
    Router.prototype.isInternalLink = function (link) {
        var href = link.getAttribute('href') || '';
        return href.includes('.html') &&
            !href.includes('login.html') &&
            !link.href.startsWith('http://') &&
            !link.href.startsWith('https://');
    };
    Router.prototype.navigate = function (url) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        history.pushState({}, '', url);
                        return [4 /*yield*/, this.loadPage(url, true)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Router.prototype.loadPage = function (url, addTransition) {
        return __awaiter(this, void 0, void 0, function () {
            var response, html, parser, doc, newContent, newTitle, error_1;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!this.contentContainer)
                            return [2 /*return*/];
                        if (!addTransition) return [3 /*break*/, 2];
                        this.contentContainer.style.transition = 'opacity 0.2s ease-in-out';
                        this.contentContainer.style.opacity = '0';
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 200); })];
                    case 1:
                        _b.sent();
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 6, , 7]);
                        return [4 /*yield*/, fetch(url)];
                    case 3:
                        response = _b.sent();
                        return [4 /*yield*/, response.text()];
                    case 4:
                        html = _b.sent();
                        parser = new DOMParser();
                        doc = parser.parseFromString(html, 'text/html');
                        newContent = doc.querySelector('.container');
                        if (newContent && this.contentContainer) {
                            // Update content
                            this.contentContainer.innerHTML = newContent.innerHTML;
                            // Fade in
                            this.contentContainer.style.opacity = '1';
                        }
                        newTitle = (_a = doc.querySelector('title')) === null || _a === void 0 ? void 0 : _a.textContent;
                        if (newTitle) {
                            document.title = newTitle;
                        }
                        return [4 /*yield*/, this.loadPageScript(url)];
                    case 5:
                        _b.sent();
                        return [3 /*break*/, 7];
                    case 6:
                        error_1 = _b.sent();
                        console.error('Navigation error:', error_1);
                        window.location.href = url;
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    Router.prototype.loadPageScript = function (url) {
        return __awaiter(this, void 0, void 0, function () {
            var match, pageName, scriptUrl, oldScripts, script;
            return __generator(this, function (_a) {
                match = url.match(/\/([^\/]+)\/\1\.html$/);
                if (match) {
                    pageName = match[1];
                    scriptUrl = "../".concat(pageName, "/").concat(pageName, ".js");
                    oldScripts = document.querySelectorAll('script[data-page-script]');
                    oldScripts.forEach(function (script) { return script.remove(); });
                    script = document.createElement('script');
                    script.src = scriptUrl;
                    script.setAttribute('data-page-script', 'true');
                    document.body.appendChild(script);
                }
                return [2 /*return*/];
            });
        });
    };
    return Router;
}());
var router = null;
function initRouter() {
    if (!router) {
        router = new Router();
    }
}
