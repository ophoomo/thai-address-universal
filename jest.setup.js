if (typeof window === 'undefined') {
    global.window = {};
}

if (typeof process === 'undefined') {
    global.process = {
        env: {
            THAI_ADDRESS_UNIVERSAL: 'thai',
        },
    };
}

const localStorageMock = (() => {
    let store = {};
    return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => {
            store[key] = value.toString();
        },
        removeItem: (key) => {
            delete store[key];
        },
        clear: () => {
            store = {};
        },
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
});
