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
exports.FilmpalastTO = void 0;
const cheerio = __importStar(require("cheerio"));
const types_1 = require("../types");
const Source_1 = require("./Source");
class FilmpalastTO extends Source_1.Source {
    fetcher;
    constructor(fetcher) {
        super();
        this.fetcher = fetcher;
    }
    id = 'filmpalast';
    label = 'Filmpalast';
    baseUrl = 'https://filmpalast.to';
    contentTypes = ['movie', 'series'];
    countryCodes = [types_1.CountryCode.de];
    priority = 1;
    // Fix: _ctx mit Unterstrich, um den TS6133 Fehler (unused variable) zu beheben
    async handleInternal(ctx, _type, id) {
        const results = [];
        const imdbId = id.toString();
        console.log(`[Filmpalast] Suche gestartet für ID: ${imdbId}`);
        if (!imdbId.startsWith('tt')) {
            console.log(`[Filmpalast] Abbruch: Keine gültige IMDb-ID (${imdbId})`);
            return [];
        }
        const searchUrl = `${this.baseUrl}/search/title/${encodeURIComponent(imdbId)}`;
        try {
            const html = await this.fetcher.text(ctx, new URL(searchUrl));
            const $ = cheerio.load(html);
            let streamPageUrl;
            const streamAnchor = $('a[href*="/stream/"]').first();
            if (streamAnchor.length > 0) {
                const href = streamAnchor.attr('href');
                streamPageUrl = href.startsWith('http') ? href : `${this.baseUrl}${href}`;
                console.log(`[Filmpalast] Stream-Seite gefunden: ${streamPageUrl}`);
            }
            else if (html.includes('currentStreamLinks')) {
                streamPageUrl = searchUrl;
                console.log(`[Filmpalast] Direkt auf Stream-Seite gelandet.`);
            }
            if (!streamPageUrl) {
                console.log(`[Filmpalast] Kein Stream-Link auf Suchseite gefunden.`);
                return [];
            }
            const streamHtml = await this.fetcher.text(ctx, new URL(streamPageUrl));
            const $stream = cheerio.load(streamHtml);
            $stream('.currentStreamLinks a').each((_, element) => {
                const href = $stream(element).attr('href');
                const hosterName = $stream(element).text().trim();
                if (href && href !== '#' && !href.includes('javascript:void')) {
                    const fullUrl = href.startsWith('http') ? href : `https:${href}`;
                    results.push({
                        url: new URL(fullUrl),
                        meta: {
                            title: `${hosterName} (Filmpalast)`,
                            countryCodes: [types_1.CountryCode.de],
                        },
                    });
                }
            });
            console.log(`[Filmpalast] Suche beendet. ${results.length} Links gefunden.`);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }
        catch (error) {
            console.error(`[Filmpalast] Fehler während des Scraping: ${error.message}`);
        }
        return results;
    }
}
exports.FilmpalastTO = FilmpalastTO;
