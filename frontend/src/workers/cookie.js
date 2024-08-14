import Cookies from 'js-cookie';

const CookieWorker = {
    setCookie: (name, value, days) => {
        Cookies.set(name, value, { expires: days });
    },
    getCookie: (name) => {
        return Cookies.get(name);
    },
    removeCookie: (name) => {
        Cookies.remove(name);
    }
};

export default CookieWorker;