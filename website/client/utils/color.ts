export const isValidHex = (hex: string): boolean => {
    const reg =/^#([0-9a-f]{3}){1,2}$/i;

    return reg.test(hex);
}