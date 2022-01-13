"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _RiotApiClient_config;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Region = exports.Http = exports.RiotApiClient = void 0;
const ContentApi_1 = require("./services/ContentApi");
const MatchApi_1 = require("./services/MatchApi");
const PlayerApi_1 = require("./services/PlayerApi");
const StoreApi_1 = require("./services/StoreApi");
const PartyApi_1 = require("./services/PartyApi");
const Http_1 = require("./Http");
const axios_1 = __importDefault(require("axios"));
const Request_1 = require("./Request");
const Endpoints_1 = require("./resources/Endpoints");
const Exceptions_1 = require("./models/Exceptions");
const tough_cookie_1 = require("tough-cookie");
const axios_fetch_adapter_1 = __importDefault(require("@vespaiach/axios-fetch-adapter"));
require("regenerator-runtime/runtime");
axios_1.default.defaults.adapter = axios_fetch_adapter_1.default;
axios_1.default.defaults.withCredentials = globalThis.window ? true : undefined;
class RiotApiClient {
    /**
     * - Initiates the base client
     * @param config Config for the lib
     */
    constructor(config) {
        _RiotApiClient_config.set(this, void 0);
        if (!(config.region instanceof Region))
            throw new Error("'Config.region' must be type of 'Region'.");
        this.http = new Http(null, null, null, __classPrivateFieldGet(this, _RiotApiClient_config, "f").ignoreCookieErrors);
        __classPrivateFieldSet(this, _RiotApiClient_config, config, "f");
        this.region = config.region;
        this.buildServices();
    }
    /**
     * - Logins into your account
     */
    async login() {
        // set cookies
        await this.playerApi.getCookies();
        this.jar = this.http.getCookieJar();
        // login and setup some stuff
        this.auth = {};
        this.auth.accessToken = await this.playerApi.getAccessToken(__classPrivateFieldGet(this, _RiotApiClient_config, "f").username, __classPrivateFieldGet(this, _RiotApiClient_config, "f").password);
        this.auth.rsoToken = await this.playerApi.getRsoToken(this.auth.accessToken);
        this.buildServices();
        // get user
        const userInfo = await this.playerApi.getInfo();
        if (userInfo.sub == "")
            throw new Error("Account ID was empty. Please start the game atleast once!");
        this.user = (await this.playerApi.getAccountById([userInfo.sub]))[0];
        // finish stuff
        this.clientVersion = await this.getClientVersion();
        this.buildServices();
        return this;
    }
    /**
     * - Gets the current client version
     */
    async getClientVersion() {
        try {
            const data = (await (0, axios_1.default)({
                method: "GET",
                url: "https://valorant-api.com/v1/version"
            })).data.data;
            const branch = data.branch;
            const build = data.buildVersion;
            const versionNum = data.version.split(".").pop();
            return branch + "-shipping-" + build + "-" + versionNum;
        }
        catch (e) {
            console.error(e);
        }
    }
    /**
     * - Initiates services
     * @warning You probably shouldn't call this method
     */
    buildServices() {
        this.http = new Http(this.auth, this.clientVersion, this.jar, __classPrivateFieldGet(this, _RiotApiClient_config, "f").ignoreCookieErrors);
        this.storeApi = new StoreApi_1.StoreApi(this);
        this.partyApi = new PartyApi_1.PartyApi(this);
        this.playerApi = new PlayerApi_1.PlayerApi(this);
        this.contentApi = new ContentApi_1.ContentApi(this);
        this.matchApi = new MatchApi_1.MatchApi(this);
    }
}
exports.RiotApiClient = RiotApiClient;
_RiotApiClient_config = new WeakMap();
/**
 * - Client platform id
 */
RiotApiClient.XRiotClientPlatform = "ew0KCSJwbGF0Zm9ybVR5cGUiOiAiUEMiLA0KCSJwbGF0Zm9ybU9TIjogIldpbmRvd3MiLA0KCSJwbGF0Zm9ybU9TVmVyc2lvbiI6ICIxMC4wLjE5MDQyLjEuMjU2LjY0Yml0IiwNCgkicGxhdGZvcm1DaGlwc2V0IjogIlVua25vd24iDQp9";
class Http extends Http_1.AbstractHttp {
    constructor(authorization, version, jar, ignoreCookieErrors = false) {
        super();
        this.auth = null;
        this.version = null;
        this.jar = new tough_cookie_1.CookieJar();
        this.auth = authorization;
        this.version = version;
        if (jar)
            this.jar = jar;
        this.ignoreCookieErrors = ignoreCookieErrors;
    }
    /**
     * - Sends a request
     * @param request Request to send
     * @throws {ApiClientException}
     */
    async sendRequest(request) {
        try {
            let modifiedReq = Request_1.RequestBuilder.fromRequest(request);
            if (this.auth != null && this.auth.accessToken != null) {
                modifiedReq.addHeader("Authorization", `${this.auth.accessToken.token_type} ${this.auth.accessToken.access_token}`);
                if (this.auth.rsoToken != null)
                    modifiedReq.addHeader("X-Riot-Entitlements-JWT", this.auth.rsoToken.entitlements_token);
            }
            if (this.version != null)
                modifiedReq.addHeader("X-Riot-ClientVersion", this.version);
            modifiedReq.addHeader("X-Riot-ClientPlatform", RiotApiClient.XRiotClientPlatform);
            modifiedReq = await this.setCookieHeaders(modifiedReq);
            const res = await (0, axios_1.default)(modifiedReq.build());
            await this.setCookieJar(res);
            return res;
        }
        catch (e) {
            throw e.response
                ? new Exceptions_1.ApiClientException(e)
                : e;
        }
    }
    /**
     * - Sets cookies in the request headers
     * @param req Request
     */
    async setCookieHeaders(req) {
        const cookie = await this.jar.getCookieString(req.getUrl());
        if (cookie)
            req.addHeader("Cookie", cookie);
        return req;
    }
    getCookieJar() {
        return this.jar;
    }
    /**
     * - Sets cookies from a response in the cookie jar
     * @param res Axios response
     */
    async setCookieJar(res) {
        var _a;
        const cookies = (_a = res.headers["set-cookie"]) !== null && _a !== void 0 ? _a : [];
        await Promise.all(cookies.map(cookie => this.jar.setCookie(cookie, res.config.url, { ignoreError: this.ignoreCookieErrors })));
    }
}
exports.Http = Http;
class Region {
    constructor(baseUrl, sharedUrl, partyUrl, name) {
        this.BaseUrl = baseUrl;
        this.SharedUrl = sharedUrl;
        this.PartyUrl = partyUrl;
        this.Name = name;
    }
}
exports.Region = Region;
Region.EU = new Region(Endpoints_1.Endpoints.EuBase, Endpoints_1.Endpoints.EuShared, Endpoints_1.Endpoints.EuParty, "eu");
Region.NA = new Region(Endpoints_1.Endpoints.NaBase, Endpoints_1.Endpoints.NaShared, Endpoints_1.Endpoints.NaParty, "na");
Region.AP = new Region(Endpoints_1.Endpoints.ApBase, Endpoints_1.Endpoints.ApShared, Endpoints_1.Endpoints.ApParty, "ap");
Region.KR = new Region(Endpoints_1.Endpoints.KrBase, Endpoints_1.Endpoints.KrShared, Endpoints_1.Endpoints.KrParty, "kr");
//# sourceMappingURL=index.js.map