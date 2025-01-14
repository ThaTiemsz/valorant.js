import { ContentApi } from "./services/ContentApi";
import { MatchApi } from "./services/MatchApi";
import { PlayerApi } from "./services/PlayerApi";
import { StoreApi } from "./services/StoreApi";
import { PartyApi } from "./services/PartyApi";
import { IAccount } from "./models/IAccount";
import { IConfig } from "./models/IConfig";
import { IAuthorization } from "./models/IAuthorization";
import { AbstractHttp } from "./Http";
import Axios, { AxiosResponse } from "axios";
import { Request, RequestBuilder } from "./Request";
import { Endpoints } from "./resources/Endpoints";
import { ApiClientException } from "./models/Exceptions";
import { CookieJar } from "tough-cookie";
import fetchAdapter from "@vespaiach/axios-fetch-adapter";
import "regenerator-runtime/runtime";

Axios.defaults.adapter = fetchAdapter;
Axios.defaults.withCredentials = globalThis.window ? true : undefined;

let debug = false;

export class RiotApiClient {
    #config: IConfig
    auth: IAuthorization
    clientVersion: string
    jar: CookieJar
    region: Region
    http: Http
    contentApi: ContentApi
    matchApi: MatchApi
    playerApi: PlayerApi
    storeApi: StoreApi
    partyApi: PartyApi
    user: IAccount

    /**
     * - Client platform id
     */
    public static readonly XRiotClientPlatform = "ew0KCSJwbGF0Zm9ybVR5cGUiOiAiUEMiLA0KCSJwbGF0Zm9ybU9TIjogIldpbmRvd3MiLA0KCSJwbGF0Zm9ybU9TVmVyc2lvbiI6ICIxMC4wLjE5MDQyLjEuMjU2LjY0Yml0IiwNCgkicGxhdGZvcm1DaGlwc2V0IjogIlVua25vd24iDQp9";

    /**
     * - Initiates the base client
     * @param config Config for the lib
     */
    constructor(config: IConfig) {
        if (!(config.region instanceof Region))
            throw new Error("'Config.region' must be type of 'Region'.")
        if (typeof config?.debug === "undefined" || config?.debug === null)
            config.debug = false
        if (typeof config?.ignoreCookieErrors === "undefined" || config?.ignoreCookieErrors === null)
            config.ignoreCookieErrors = false

        debug = true;
        this.#config = config;
        this.http = new Http(null, null, null, this.#config.ignoreCookieErrors);
        this.region = config.region;
        this.buildServices();
    }

    /**
     * - Logins into your account
     */
    async login(): Promise<RiotApiClient> {
        // set cookies
        this.jar = await this.playerApi.getCookies();
        if (debug) console.log("RiotApiClient.login playerApi.getCookies", this.jar);
        this.buildServices(); // calling this method so many times is bad
        // login and setup some stuff
        (this.auth as any) = {};
        this.auth.accessToken = await this.playerApi.getAccessToken(this.#config.username, this.#config.password);
        this.auth.rsoToken = await this.playerApi.getRsoToken(this.auth.accessToken);
        this.buildServices();
        // get user
        const userInfo = await this.playerApi.getInfo()
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
    async getClientVersion(): Promise<string> {
        try {
            const data = (await Axios({
                method: "GET",
                url: "https://valorant-api.com/v1/version"
            })).data.data;

            const branch = data.branch;
            const build = data.buildVersion;
            const versionNum = data.version.split(".").pop();

            return branch + "-shipping-" + build + "-" + versionNum;
        } catch (e) {
            console.error(e);
        }
    }

    /**
     * - Initiates services
     * @warning You probably shouldn't call this method
     */
    buildServices() {
        this.http = new Http(this.auth, this.clientVersion, this.jar, this.#config?.ignoreCookieErrors);
        this.storeApi = new StoreApi(this);
        this.partyApi = new PartyApi(this);
        this.playerApi = new PlayerApi(this);
        this.contentApi = new ContentApi(this);
        this.matchApi = new MatchApi(this);
    }
}

export class Http extends AbstractHttp {
    private readonly auth?: IAuthorization = null;
    private readonly version?: string = null;
    private readonly jar = new CookieJar();
    private readonly ignoreCookieErrors: boolean;

    constructor(authorization?: IAuthorization, version?: string, jar?: CookieJar, ignoreCookieErrors: boolean = false) {
        super();
        this.auth = authorization;
        this.version = version;
        if (jar) this.jar = jar;
        this.ignoreCookieErrors = ignoreCookieErrors;
    }

    /**
     * - Sends a request
     * @param request Request to send
     * @throws {ApiClientException}
     */
    async sendRequest(request: Request): Promise<AxiosResponse> {
        try {
            let modifiedReq = RequestBuilder.fromRequest(request);

            if (this.auth != null && this.auth.accessToken != null) {
                modifiedReq.addHeader("Authorization", `${this.auth.accessToken.token_type} ${this.auth.accessToken.access_token}`);
                if (this.auth.rsoToken != null)
                    modifiedReq.addHeader("X-Riot-Entitlements-JWT", this.auth.rsoToken.entitlements_token);
            }
            if (this.version != null)
                modifiedReq.addHeader("X-Riot-ClientVersion", this.version);

            modifiedReq.addHeader("X-Riot-ClientPlatform", RiotApiClient.XRiotClientPlatform);
            modifiedReq = await this.setCookieHeaders(modifiedReq);

            const res = await Axios(modifiedReq.build());
            await this.setCookieJar(res);
            return res;
        } catch (e) {
            throw e.response
                ? new ApiClientException(e)
                : e;
        }
    }

    /**
     * - Sets cookies in the request headers
     * @param req Request
     */
    async setCookieHeaders(req: RequestBuilder): Promise<RequestBuilder> {
        const cookie = await this.jar.getCookieString(req.getUrl());
        if (cookie)
            req.addHeader("Cookie", cookie);
        if (debug) console.log("Http.setCookieHeaders cookie", cookie);
        return req;
    }

    public getCookieJar() {
        return this.jar;
    }

    /**
     * - Sets cookies from a response in the cookie jar
     * @param res Axios response
     */
    async setCookieJar(res: AxiosResponse): Promise<void> {
        const cookies = res.headers.getAll("set-cookie") ?? [];
        if (debug) console.log("Http.setCookieJar cookies", cookies);
        await Promise.all(
            cookies.map(cookie => this.jar.setCookie(cookie, res.config.url, { ignoreError: this.ignoreCookieErrors }))
        );
    }
}

export class Region {
    BaseUrl: string
    SharedUrl: string
    PartyUrl: string
    Name: string

    constructor(baseUrl: string, sharedUrl: string, partyUrl: string, name: string) {
        this.BaseUrl = baseUrl;
        this.SharedUrl = sharedUrl;
        this.PartyUrl = partyUrl;
        this.Name = name;
    }

    static EU = new Region(Endpoints.EuBase, Endpoints.EuShared, Endpoints.EuParty, "eu");
    static NA = new Region(Endpoints.NaBase, Endpoints.NaShared, Endpoints.NaParty, "na");
    static AP = new Region(Endpoints.ApBase, Endpoints.ApShared, Endpoints.ApParty, "ap");
    static KR = new Region(Endpoints.KrBase, Endpoints.KrShared, Endpoints.KrParty, "kr")
}