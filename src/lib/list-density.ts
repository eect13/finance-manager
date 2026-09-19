const KEY = "finance-manager-list-density";
const ATTR = "data-list-density";
const LIST_DENSITY_DEFAULT = "comfortable";

/** Apply Comfortable before paint and drop a leftover Compact localStorage key. */
export const LIST_DENSITY_BOOT = `(function(){try{var k=${JSON.stringify(KEY)};try{localStorage.removeItem(k);}catch(e){}document.documentElement.setAttribute(${JSON.stringify(ATTR)},${JSON.stringify(LIST_DENSITY_DEFAULT)});}catch(e){}})();`;
