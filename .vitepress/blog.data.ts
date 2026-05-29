import { blogLoader, type Post } from "./blog-loader";

export type { Post };

declare const data: Post[];
export { data };

export default blogLoader();
