import { create } from 'zustand';

// Structure d'un bloc par défaut :
// { id: 'uuid', type: 'text'|'image'|'section', props: { className: '', content: '' }, children: [] }

const findBlockById = (blocks, id) => {
  for (const block of blocks) {
    if (block.id === id) return block;
    if (block.children?.length) {
      const found = findBlockById(block.children, id);
      if (found) return found;
    }
  }
  return null;
};

const updateBlockInTree = (blocks, id, updatedProperties) => {
  return blocks.map((block) => {
    if (block.id === id) {
      return {
        ...block,
        ...updatedProperties,
        props: { ...block.props, ...updatedProperties.props },
      };
    }
    if (block.children?.length) {
      return { ...block, children: updateBlockInTree(block.children, id, updatedProperties) };
    }
    return block;
  });
};

const deleteBlockInTree = (blocks, id) => {
  return blocks
    .filter((block) => block.id !== id)
    .map((block) => ({
      ...block,
      children: block.children?.length ? deleteBlockInTree(block.children, id) : [],
    }));
};

const addBlockToParent = (blocks, parentId, newBlock) => {
  return blocks.map((block) => {
    if (block.id === parentId) {
      return {
        ...block,
        children: [...(block.children || []), newBlock],
      };
    }
    if (block.children?.length) {
      return {
        ...block,
        children: addBlockToParent(block.children, parentId, newBlock),
      };
    }
    return block;
  });
};

export const useEditorStore = create((set, get) => ({
  blocks: [], // L'arbre principal du DOM JSON
  selectedBlockId: null,
  previewMode: 'desktop', // 'desktop' | 'tablet' | 'mobile'

  initBlocks: (initialBlocks) => set({ blocks: initialBlocks }),

  addBlock: (block, parentId = null) => set((state) => ({
    blocks: parentId ? addBlockToParent(state.blocks, parentId, block) : [...state.blocks, block],
  })),

  updateBlock: (id, updatedProperties) => set((state) => ({
    blocks: updateBlockInTree(state.blocks, id, updatedProperties),
  })),

  deleteBlock: (id) => set((state) => ({
    blocks: deleteBlockInTree(state.blocks, id),
    selectedBlockId: state.selectedBlockId === id ? null : state.selectedBlockId
  })),

  getBlockById: (id) => findBlockById(get().blocks, id),

  selectBlock: (id) => set({ selectedBlockId: id }),

  setPreviewMode: (mode) => set({ previewMode: mode }),

  reorderBlocks: (newBlocksOrder) => set({ blocks: newBlocksOrder })
}));