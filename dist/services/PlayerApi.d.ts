import { RiotApiClient } from "../index";
import { IUserInfo } from "../models/IUserInfo";
import { IAccessToken } from "../models/IAccessToken";
import { IRsoToken } from "../models/IRsoToken";
import { IAccount } from "../models/IAccount";
export declare class PlayerApi {
    private _client;
    constructor(client: RiotApiClient);
    /**
     * - Gets an account by id
     * @param accountIds Array of account ids to get
     */
    getAccountById(accountIds: string[]): Promise<IAccount[]>;
    /**
     * - Gets information about the user's account
     */
    getInfo(): Promise<IUserInfo>;
    /**
     * - Gets the cookies
     */
    getCookies(): Promise<void>;
    /**
     * - Gets an access token
     * @param username Username of the account
     * @param password Password of the account
     */
    getAccessToken(username: string, password: string): Promise<IAccessToken>;
    /**
     * - Gets an entitlement token
     * @param auth Authorization header to use
     */
    getRsoToken(auth: IAccessToken): Promise<IRsoToken>;
    /**
     * - Gets the players inventory
     * @param accountId Account to get the inventory for
     */
    getInventory(accountId: string): Promise<{
        characters: any[];
        maps: any[];
        chromas: any[];
        skins: any[];
        skinLevels: any[];
        attachments: any[];
        equips: any[];
        themes: any[];
        gamemodes: any[];
        sprays: any[];
        sprayLevels: any[];
        charms: any[];
        charmLevels: any[];
        playerCards: any[];
        playerTitles: any[];
        storefrontItems: any[];
    } | {
        Subject: any;
        Version: any;
        GunSkins: {};
        Sprays: {};
        Identity: any;
    }>;
}