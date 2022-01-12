import { ContentApi } from "./services/ContentApi";
import { MatchApi } from "./services/MatchApi";
import { PlayerApi } from "./services/PlayerApi";
import { StoreApi } from "./services/StoreApi";
import { PartyApi } from "./services/PartyApi";
import { IAccount } from "./models/IAccount";
import { IConfig } from "./models/IConfig";
import { IAuthorization } from "./models/IAuthorization";
import { AbstractHttp } from "./Http";
import { AxiosResponse } from "axios";
import { Request } from "./Request";
import { CookieJar } from "tough-cookie";
import "regenerator-runtime/runtime";
export declare class RiotApiClient {
    #private;
    auth: IAuthorization;
    clientVersion: string;
    jar: CookieJar;
    region: Region;
    http: Http;
    contentApi: ContentApi;
    matchApi: MatchApi;
    playerApi: PlayerApi;
    storeApi: StoreApi;
    partyApi: PartyApi;
    user: IAccount;
    /**
     * - Client platform id
     */
    static readonly XRiotClientPlatform = "ew0KCSJwbGF0Zm9ybVR5cGUiOiAiUEMiLA0KCSJwbGF0Zm9ybU9TIjogIldpbmRvd3MiLA0KCSJwbGF0Zm9ybU9TVmVyc2lvbiI6ICIxMC4wLjE5MDQyLjEuMjU2LjY0Yml0IiwNCgkicGxhdGZvcm1DaGlwc2V0IjogIlVua25vd24iDQp9";
    /**
     * - Initiates the base client
     * @param config Config for the lib
     */
    constructor(config: IConfig);
    /**
     * - Logins into your account
     */
    login(): Promise<RiotApiClient>;
    /**
     * - Gets the current client version
     */
    getClientVersion(): Promise<string>;
    /**
     * - Initiates services
     * @warning You probably shouldn't call this method
     */
    buildServices(): void;
}
export declare class Http extends AbstractHttp {
    private readonly auth?;
    private readonly version?;
    private readonly jar;
    constructor(authorization?: IAuthorization, version?: string, jar?: CookieJar);
    /**
     * - Sends a request
     * @param request Request to send
     * @throws {ApiClientException}
     */
    sendRequest(request: Request): Promise<AxiosResponse>;
}
export declare class Region {
    BaseUrl: string;
    SharedUrl: string;
    PartyUrl: string;
    Name: string;
    constructor(baseUrl: string, sharedUrl: string, partyUrl: string, name: string);
    static EU: Region;
    static NA: Region;
    static AP: Region;
    static KR: Region;
}
