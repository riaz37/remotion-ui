/**
 * One source for the Memfind cross-promo. The banner, corner card and nav link
 * make the same offer, so the code, price and links live here.
 *
 * The code is a custom App Store offer code created in App Store Connect for
 * the `com.memfind.app.unlock` in-app purchase. If it is retired there, take
 * the promo down here too, or visitors get an invalid-code error.
 */
const APP_STORE_ID = "6825525742";

export const OFFER_CODE = "REMOTIONUI";

export const memfindOffer = {
  name: "Memfind",
  code: OFFER_CODE,
  price: "$1.99",
  regularPrice: "$14.99",
  definition:
    "Search your photos, screenshots, videos and PDFs in your own words. Everything stays on your device.",
  /** Opens the App Store redeem sheet with the code pre-filled. */
  redeemUrl: `https://apps.apple.com/redeem?ctx=offercodes&id=${APP_STORE_ID}&code=${OFFER_CODE}`,
  appStoreUrl: `https://apps.apple.com/app/id${APP_STORE_ID}?pt=129597670&ct=remotionui&mt=8`,
  siteUrl: "https://getmemfind.com/?ref=remotionui",
  iconSrc: "/memfind/icon.png",
} as const;
