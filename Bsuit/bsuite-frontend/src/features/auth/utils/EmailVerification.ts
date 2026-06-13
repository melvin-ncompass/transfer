export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidEmail = (mail: string) => {
    return emailRegex.test(mail);
};