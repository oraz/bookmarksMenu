
export function getCurrency(chromeLang: string, acceptLanguages: string[]): string {
    type RegExpProvider = () => RegExp;
    const currencies = new Map<string, RegExpProvider>();

    currencies.set('AUD', () => /[-_]AU$/i);
    currencies.set('CAD', () => /[-_]CA$/i);
    currencies.set('CHF', () => /[-_]CH$/i);
    currencies.set('EUR', () => /^(et|de|fi|fr|el|it|lv|lt|mt|nl|pt|sk|sl|es)$|^..[-_](AT|BE|CY|EE|FI|FR|DE|GR|IE|IT|LV|LT|LU|MT|NL|PT|SK|SL|ES)$/i);
    currencies.set('GBP', () => /[-_]GB$/i);
    currencies.set('JPY', () => /^ja$|^..[-_]JP$/i);
    currencies.set('RUB', () => /^ru$|^..[-_]RU$/i);

    for (const [currency, regExpProvider] of currencies) {
        const regex = regExpProvider();
        if (regex.test(chromeLang)) {
            return currency;
        }
        for (const lang of acceptLanguages) {
            if (regex.test(lang)) {
                return currency;
            }
        }
    }

    return 'USD';
}