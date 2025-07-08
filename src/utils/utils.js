// simple random helpers
export function randomInt(min, max) {
    if (min > max) [min, max] = [max, min];
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomFloat(min, max) {
    if (min > max) [min, max] = [max, min];
    return Math.random() * (max - min) + min;
}