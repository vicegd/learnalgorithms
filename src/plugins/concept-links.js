/**
 * concept-links.js
 *
 * Dictionary of concept terms → URLs for the remark-autolink-concepts plugin.
 *
 * HOW TO ADD A NEW CONCEPT:
 *   1. Add one entry per term variant (with/without hyphen, plural forms, etc.)
 *   2. All variants pointing to the same URL are treated as aliases:
 *      only ONE link is inserted per URL per page.
 *
 * Format:
 *   'term to match (case-insensitive)': '/concepts/<category>/<slug>',
 */

const CONCEPT_LINKS = {
  'brute force':  '/concepts/design-paradigms/brute-force',
  'brute-force':  '/concepts/design-paradigms/brute-force',
};

export default CONCEPT_LINKS;
