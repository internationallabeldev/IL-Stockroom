import StarterKit from '@tiptap/starter-kit'
import Mention from '@tiptap/extension-mention'

/** A reference to an existing system entity (inventory, order, requisition, …).
 *  Triggered by `/` in the composer; rendered as a clickable chip that carries
 *  the target `url` and a `q` term to seed that page's search box. */
export const Reference = Mention.extend({
  name: 'reference',
  addAttributes() {
    return {
      id:    { default: null, parseHTML: el => el.getAttribute('data-id'),    renderHTML: a => (a.id ? { 'data-id': a.id } : {}) },
      label: { default: null, parseHTML: el => el.getAttribute('data-label'), renderHTML: a => (a.label ? { 'data-label': a.label } : {}) },
      url:   { default: null, parseHTML: el => el.getAttribute('data-url'),   renderHTML: a => (a.url ? { 'data-url': a.url } : {}) },
      q:     { default: null, parseHTML: el => el.getAttribute('data-q'),     renderHTML: a => (a.q ? { 'data-q': a.q } : {}) },
    }
  },
})

/** Extensions used to render/sanitize stored message HTML (no live suggestions).
 *  Must include every node/mark the composer can produce, or it gets stripped. */
export const renderExtensions = [
  StarterKit,
  Mention.configure({ HTMLAttributes: { class: 'mention' } }),
  Reference.configure({ HTMLAttributes: { class: 'chat-ref' }, suggestion: { char: '/' } }),
]
