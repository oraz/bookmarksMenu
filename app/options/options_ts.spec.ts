import { getCurrency } from './options_ts';

describe('getCurrency', () => {
    it.each([
        ['en', ['en', 'en-AU'], 'AUD'],
        ['en', ['en', 'en_au'], 'AUD'],
        ['en-au', ['en'], 'AUD'],

        ['en', ['en', 'en_CA'], 'CAD'],
        ['en', ['en', 'en-ca'], 'CAD'],
        ['en-CA', ['en'], 'CAD'],

        ['en', ['en', 'en-CH'], 'CHF'],
        ['en', ['en', 'en_ch'], 'CHF'],
        ['it-ch', ['en'], 'CHF'],

        ['en', ['en', 'en-at'], 'EUR'],
        ['en-AT', ['en'], 'EUR'],
        ['en', ['en', 'en-BE'], 'EUR'],
        ['en', ['en', 'en_CY'], 'EUR'],
        ['en', ['en', 'en-EE'], 'EUR'],
        ['et', ['xx', 'xx-xx'], 'EUR'],
        ['en', ['en', 'en-FI'], 'EUR'],
        ['fi', ['xx', 'xx-xx'], 'EUR'],
        ['en', ['en', 'en-FR'], 'EUR'],
        ['fr', ['xx', 'xx-xx'], 'EUR'],
        ['en', ['en', 'en-de'], 'EUR'],
        ['de', ['xx', 'xx-xx'], 'EUR'],
        ['en', ['en', 'en-gr'], 'EUR'],
        ['el', ['xx', 'xx-xx'], 'EUR'],
        ['en', ['en', 'en-ie'], 'EUR'], // Ireland
        ['en', ['en', 'en-it'], 'EUR'],
        ['it', ['xx', 'xx-xx'], 'EUR'],
        ['en', ['en', 'en-lv'], 'EUR'],
        ['lv', ['xx', 'xx-xx'], 'EUR'],
        ['en', ['en', 'en-lt'], 'EUR'],
        ['lt', ['xx', 'xx-xx'], 'EUR'],
        ['en', ['en', 'en-lu'], 'EUR'],
        ['en', ['en', 'en-mt'], 'EUR'],
        ['mt', ['xx', 'xx-xx'], 'EUR'],
        ['en', ['en', 'en-nl'], 'EUR'],
        ['nl', ['xx', 'xx-xx'], 'EUR'],
        ['en', ['en', 'en_PT'], 'EUR'],
        ['pt', ['xx', 'xx-xx'], 'EUR'],
        ['en', ['en', 'en_sk'], 'EUR'],
        ['sk', ['xx', 'xx-xx'], 'EUR'],
        ['en', ['en', 'en_sl'], 'EUR'],
        ['sl', ['xx', 'xx-xx'], 'EUR'],
        ['en', ['en', 'en_Es'], 'EUR'],
        ['es', ['xx', 'xx-xx'], 'EUR'],

        ['en', ['en', 'en-GB'], 'GBP'],
        ['en', ['en', 'en_gb'], 'GBP'],
        ['en_gb', ['en'], 'GBP'],

        ['en', ['en', 'en-JP'], 'JPY'],
        ['en', ['en', 'en_jp'], 'JPY'],
        ['ja', ['xx', 'xx-xx'], 'JPY'],
        ['ja-jp', ['xx', 'xx-xx'], 'JPY'],

        ['en', ['en', 'en-RU'], 'RUB'],
        ['en', ['en', 'en_ru'], 'RUB'],
        ['ru', ['xx', 'xx-xx'], 'RUB'],
        ['ru-RU', ['xx', 'xx-xx'], 'RUB'],

        ['en', ['en', 'en-US'], 'USD'],
        ['en', ['en', 'en_us'], 'USD'],
        ['en-US', ['en'], 'USD'],
        ['xx', ['xx'], 'USD'],
        ['xx', ['xx-xx'], 'USD'],
        ['', [], 'USD']

    ])('[%s, %s, %s]', (lang, acceptLanguages, expectedCurrency) => {
        const currency = getCurrency(lang, acceptLanguages);

        expect(currency).toEqual(expectedCurrency);
    });
});
