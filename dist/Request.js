"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Request = exports.RequestBuilder = void 0;
class RequestBuilder {
    constructor() {
        this._headers = {};
        this._body = null;
        this._url = "";
    }
    static fromRequest(request) {
        const objMap = new Map(Object.entries(request.headers));
        let obj = new RequestBuilder()
            .setBody(request.data)
            .setMethod(request.method)
            .setUrl(request.url);
        objMap.forEach((v, k) => obj = obj.addHeader(k, v));
        return obj;
    }
    getUrl() {
        return this._url;
    }
    setUrl(url) {
        this._url = url;
        return this;
    }
    setBody(body) {
        this._body = body;
        return this;
    }
    setMethod(method) {
        this._method = method;
        return this;
    }
    addHeader(key, value) {
        this._headers[key] = value;
        return this;
    }
    setCookieJar(jar) {
        this._jar = jar;
        return this;
    }
    build() {
        return new Request(this._url, this._method, this._headers, this._body, this._jar);
    }
}
exports.RequestBuilder = RequestBuilder;
class Request {
    constructor(url, method, headers, body, jar) {
        this.withCredentials = globalThis.window ? true : undefined;
        this.url = url;
        this.method = method;
        this.headers = headers;
        this.data = body;
        this.jar = jar;
    }
}
exports.Request = Request;
//# sourceMappingURL=Request.js.map