// Build-time tokenization with OpenAI's published o200k_base vocabulary (the same one the tokenizer demo loads in the browser).
import { encode, decode } from 'gpt-tokenizer/encoding/o200k_base';

/** [text, id] for every token of t. A token that is only part of a character decodes to U+FFFD. */
export const toks = (t: string): [string, number][] => encode(t).map(id => [decode([id]), id]);
