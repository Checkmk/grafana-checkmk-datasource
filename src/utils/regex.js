const isValidRegex = (regexString) => {
    try {
        new RegExp(regexString);
        return true;
    } catch(e) {
        return false;
    }
};

export {
    isValidRegex
};