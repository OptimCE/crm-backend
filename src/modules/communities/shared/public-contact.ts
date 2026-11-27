/**
 * Plausible phone number for a community's public contact: 8 to 15 digits (the
 * E.164 maximum), an optional leading `+`, and the separators people type in
 * Belgium — spaces, dots, slashes, dashes and brackets (`+32 470 12 34 56`,
 * `04/123.45.67`, `+32 (0)2 123 45 67`).
 *
 * Deliberately not a numbering-plan check: the number is shown as typed and
 * turned into a `tel:` link, so it only has to be dialable. The frontend's
 * `phoneValidator()` uses the same expression; keep them identical.
 */
export const PUBLIC_PHONE_PATTERN = /^\+?(?:[\s./()-]*\d){8,15}[\s./()-]*$/;
