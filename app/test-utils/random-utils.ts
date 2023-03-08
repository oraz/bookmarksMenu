const charactersAndNumbers = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const charactersAndNumbersLength = charactersAndNumbers.length;

export function randomAlphanumeric(length = 10): string {
    let result = '';
    for (let i = 0; i < length; i++) {
        result += charactersAndNumbers.charAt(
            Math.floor(Math.random() * charactersAndNumbersLength)
        );
    }
    return result;
}
