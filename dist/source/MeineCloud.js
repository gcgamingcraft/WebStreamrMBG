"use strict";
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
exports.MeineCloud = void 0;
const cheerio = __importStar(require("cheerio"));
const types_1 = require("../types");
const utils_1 = require("../utils");
const Source_1 = require("./Source");
class MeineCloud extends Source_1.Source {
    id = 'meinecloud';
    label = 'MeineCloud';
    contentTypes = ['movie'];
    countryCodes = [types_1.CountryCode.de];
    baseUrl = 'https://meinecloud.click';
    fetcher;
    constructor(fetcher) {
        super();
        this.fetcher = fetcher;
    }
    async handleInternal(ctx, _type, id) {
        const imdbId = await (0, utils_1.getImdbId)(ctx, this.fetcher, id);
        const pageUrl = new URL(`/movie/${imdbId.id}`, this.baseUrl);
        try {
            // IMPORTANT: Pass the URL object directly (not .toString())
            const html = await this.fetcher.text(ctx, pageUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                    'Accept-Language': 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7',
                    'Referer': 'https://meinecloud.click/',
                    'Sec-Fetch-Site': 'same-origin',
                    'Sec-Fetch-Mode': 'navigate',
                    'Sec-Fetch-Dest': 'document',
                    'Upgrade-Insecure-Requests': '1',
                },
                timeout: 15000,
            });
            const $ = cheerio.load(html);
            const results = [];
            $('[data-link!=""]').each((_i, el) => {
                let link = $(el).attr('data-link')?.trim();
                if (!link)
                    return;
                if (link.startsWith('//')) {
                    link = 'https:' + link;
                }
                else if (!link.startsWith('http')) {
                    link = 'https://' + link;
                }
                try {
                    const url = new URL(link);
                    // Skip internal links
                    if (url.host.includes('meinecloud')) {
                        return;
                    }
                    results.push({
                        url: url, // Must be URL object
                        meta: {
                            countryCodes: [types_1.CountryCode.de],
                            referer: this.baseUrl,
                        },
                    });
                }
                catch {
                    // invalid URL, skip
                }
            });
            return results;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }
        catch (error) {
            console.error(`[MeineCloud] Error fetching ${pageUrl.href}:`, error.message || error);
            return [];
        }
    }
}
exports.MeineCloud = MeineCloud;
