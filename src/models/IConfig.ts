import { Region } from "../index";

export interface IConfig {
    /**
     * - Username of your account
     */
    username: string,
    /**
     * - Password of your account
     */
    password: string,
    /**
     * - Region of your account
     */
    region: Region,
    /**
     * - Whether to get verbose output
     * @default false
     */
    debug?: boolean
    /**
     * - Whether to ignore cookie errors
     * @default false
     */
    ignoreCookieErrors?: boolean
}