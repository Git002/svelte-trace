// index.d.ts
declare module "svelte-trace" {
  export interface MarkupParams {
    content: string;
    filename: string;
  }

  export interface MarkupResult {
    code: string;
  }

  export interface Preprocessor {
    name: string;
    markup: (params: MarkupParams) => MarkupResult | undefined;
  }

  /**
   * A preprocessor for Svelte files.
   * Adds unique `data-svelte-trace` attributes to HTML elements.
   */
  export function svelteTrace(): Preprocessor;
}
