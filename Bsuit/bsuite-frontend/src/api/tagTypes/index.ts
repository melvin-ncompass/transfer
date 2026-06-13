import { BOOKS_TAGS } from "./books.tags";
import { PEOPLE_TAGS } from "./people.tags";

export const TAGS = [
  ...PEOPLE_TAGS,
  ...BOOKS_TAGS,
] as const;
