import { loadFont } from "@remotion/google-fonts/Inter";
import { loadFont as loadEmoji } from "@remotion/google-fonts/NotoColorEmoji";
import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";

export const { fontFamily: INTER } = loadFont("normal", {
  weights: ["500", "600", "700", "800", "900"],
  subsets: ["latin", "latin-ext"],
});

export const { fontFamily: EMOJI } = loadEmoji();

// film (sadece ses kaydindan sinematik anlatim): modern sans + yuksek kontrastli serif
import { loadFont as loadJakarta } from "@remotion/google-fonts/PlusJakartaSans";
import { loadFont as loadBodoni } from "@remotion/google-fonts/BodoniModa";
export const { fontFamily: SANS } = loadJakarta("normal", { weights: ["300", "400", "500", "700", "800"], subsets: ["latin", "latin-ext"] });
export const { fontFamily: DIDONE } = loadBodoni("normal", { weights: ["400", "500"], subsets: ["latin", "latin-ext"] });
export const { fontFamily: DIDONE_I } = loadBodoni("italic", { weights: ["400", "500"], subsets: ["latin", "latin-ext"] });

// derinlik stili: "competing" gibi zarif italik vurgu satiri
export const { fontFamily: SERIF } = loadSerif("italic", { weights: ["400"], subsets: ["latin", "latin-ext"] });
