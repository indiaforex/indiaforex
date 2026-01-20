import { ForumComment } from "@/types/forum";

export interface CommentNode extends ForumComment {
    children: CommentNode[];
}

export function buildCommentTree(comments: ForumComment[]): CommentNode[] {
    const commentMap = new Map<string, CommentNode>();
    const rootComments: CommentNode[] = [];

    // 1. Create Nodes
    comments.forEach(c => {
        commentMap.set(c.id, { ...c, children: [] });
    });

    // 2. Link Parent/Child
    comments.forEach(c => {
        const node = commentMap.get(c.id)!;
        if (c.parent_id && commentMap.has(c.parent_id)) {
            commentMap.get(c.parent_id)!.children.push(node);
        } else {
            rootComments.push(node);
        }
    });

    // 3. Sort by created_at (Oldest first for conversation flow, or Newest first?)
    // Typically Root comments = Newest First. Replies = Oldest First.
    rootComments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const sortChildren = (nodes: CommentNode[]) => {
        nodes.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        nodes.forEach(n => sortChildren(n.children));
    };

    // Sort logic: Roots (Newest on top), Replies (Oldest on top - chronological)
    sortChildren(rootComments);

    return rootComments;
}
