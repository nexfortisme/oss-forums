<script setup lang="ts">
import { computed } from 'vue'
import type { Comment } from '../types/forum'
import { useForumStore } from '../stores/forum'
import CommentTree, { type CommentNode } from './CommentTree.vue'

type Props = {
  comments: Comment[]
  postId: string
}

const props = defineProps<Props>()
const store = useForumStore()

const buildTree = (items: Comment[]): CommentNode[] => {
  const nodes = new Map<string, CommentNode>()
  const roots: CommentNode[] = []

  items.forEach((item) => {
    nodes.set(item.id, { ...item, children: [] })
  })

  items.forEach((item) => {
    const node = nodes.get(item.id)
    if (!node) return

    if (item.parentId && nodes.has(item.parentId)) {
      nodes.get(item.parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  })

  const sortNodes = (list: CommentNode[]) => {
    list.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    list.forEach((child) => sortNodes(child.children))
  }

  sortNodes(roots)
  return roots
}

const commentTree = computed(() => buildTree(props.comments))

const handleReply = (parentId: string, body: string) => {
  store.addComment(props.postId, body, parentId)
}
</script>

<template>
  <div class="comment-thread">
    <CommentTree v-for="node in commentTree" :key="node.id" :node="node" @reply="handleReply" />
  </div>
</template>

<style scoped>
.comment-thread {
  display: grid;
  gap: 1rem;
}
</style>
