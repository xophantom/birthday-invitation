/** sessionStorage flag: this tab has already been through the opening. */
export const OPENING_SEEN_KEY = 'convite:abertura-vista'

/**
 * Inlined in the HTML ahead of the invitation, so it runs before first paint.
 *
 * The server can't read sessionStorage, so it always renders the opening —
 * rendering the invitation instead let it flash for a second or two on a slow
 * connection before the tap gate covered it, spoiling the reveal. This flags
 * <html> for a guest who already saw the opening, and the overlay's
 * `in-data-opening-seen:hidden` keeps it from ever painting for them.
 */
export const openingSeenScript = `try{if(sessionStorage.getItem(${JSON.stringify(OPENING_SEEN_KEY)})==='1')document.documentElement.dataset.openingSeen=''}catch(e){}`
