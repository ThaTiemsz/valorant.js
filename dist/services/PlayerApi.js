"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerApi = void 0;
const Request_1 = require("../Request");
const Endpoints_1 = require("../resources/Endpoints");
const querystring_1 = __importDefault(require("querystring"));
const ItemParser_1 = require("../helpers/ItemParser");
const Exceptions_1 = require("../models/Exceptions");
const UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36";
class PlayerApi {
    constructor(client) {
        this._client = client;
    }
    /**
     * - Gets an account by id
     * @param accountIds Array of account ids to get
     */
    async getAccountById(accountIds) {
        const accReq = new Request_1.RequestBuilder()
            .setUrl(this._client.region.BaseUrl + "/name-service/v2/players")
            .setMethod("PUT")
            .setBody(accountIds)
            .build();
        return (await this._client.http.sendRequest(accReq)).data;
    }
    /**
     * - Gets information about the user's account
     */
    async getInfo() {
        const userReq = new Request_1.RequestBuilder()
            .setMethod("POST")
            .setUrl(Endpoints_1.Endpoints.Auth + "/userinfo")
            .setBody({})
            .build();
        return (await this._client.http.sendRequest(userReq)).data;
    }
    /**
     * - Gets the cookies
     */
    async getCookies() {
        const cookieReq = new Request_1.RequestBuilder()
            .setMethod("POST")
            .setUrl(Endpoints_1.Endpoints.Auth + "/api/v1/authorization")
            .addHeader("content-type", "application/json")
            .addHeader("user-agent", UserAgent)
            .setBody({
            "client_id": "play-valorant-web-prod",
            "nonce": "1",
            "redirect_uri": "https://playvalorant.com/opt_in",
            "response_type": "token id_token"
        })
            .build();
        await this._client.http.sendRequest(cookieReq);
        return this._client.http.getCookieJar();
    }
    /**
     * - Gets an access token
     * @param username Username of the account
     * @param password Password of the account
     */
    async getAccessToken(username, password) {
        const loginReq = new Request_1.RequestBuilder()
            .setMethod("PUT")
            .setUrl(Endpoints_1.Endpoints.Auth + "/api/v1/authorization")
            .addHeader("content-type", "application/json")
            .addHeader("user-agent", UserAgent)
            .setBody({
            "type": "auth",
            "username": username,
            "password": password
        })
            .build();
        const loginRes = (await this._client.http.sendRequest(loginReq)).data;
        if (!loginRes.response) {
            throw new Exceptions_1.InvalidCredsException(username, "Login failed: Invalid credentials!");
        }
        const bodyStr = loginRes.response.parameters.uri.split("#")[1];
        const bodyObj = querystring_1.default.parse(bodyStr);
        return bodyObj;
    }
    /**
     * - Gets an entitlement token
     * @param auth Authorization header to use
     */
    async getRsoToken(auth) {
        const rsoReq = new Request_1.RequestBuilder()
            .setMethod("POST")
            .setUrl(Endpoints_1.Endpoints.Entitlements + "/api/token/v1")
            .addHeader("Authorization", `${auth.token_type} ${auth.access_token}`)
            .addHeader("content-type", "application/json")
            .setBody({})
            .build();
        return (await this._client.http.sendRequest(rsoReq)).data;
    }
    /**
     * - Gets the players inventory
     * @param accountId Account to get the inventory for
     */
    async getInventory(accountId) {
        const itemReq = new Request_1.RequestBuilder()
            .setMethod("GET")
            .setUrl(this._client.region.BaseUrl + "/personalization/v2/players/" + accountId + "/playerloadout")
            .build();
        const itemRes = (await this._client.http.sendRequest(itemReq)).data;
        const parser = new ItemParser_1.ItemParser(itemRes);
        return parser.parse();
    }
}
exports.PlayerApi = PlayerApi;
//# sourceMappingURL=PlayerApi.js.map