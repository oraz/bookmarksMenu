
export function getCurrency(chromeLang: string, acceptLanguages: string[]): string {
    const currencies = new Map<string, (locale: string) => boolean>();

    currencies.set('AUD', (locale: string) => /[-_]AU$/i.test(locale));
    currencies.set('CAD', locale => /[-_]CA$/i.test(locale));
    currencies.set('CHF', locale => /[-_]CH$/i.test(locale));
    currencies.set('EUR', locale => /^(et|de|fi|fr|el|it|lv|lt|mt|nl|pt|sk|sl|es)$|^..[-_](AT|BE|CY|EE|FI|FR|DE|GR|IE|IT|LV|LT|LU|MT|NL|PT|SK|SL|ES)$/i.test(locale));
    currencies.set('GBP', locale => /[-_]GB$/i.test(locale));
    currencies.set('JPY', locale => /^ja$|^..[-_]JP$/i.test(locale));
    currencies.set('RUB', locale => /^ru$|^..[-_]RU$/i.test(locale));

    for (var [currency, check] of currencies) {
        if (check(chromeLang)) {
            return currency;
        }
        for (var lang of acceptLanguages) {
            if (check(lang)) {
                return currency;
            }
        }
    }

    return 'USD';
}