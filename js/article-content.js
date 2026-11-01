// Deliberately small Markdown subset. All source text stays in text nodes;
// raw HTML, links, images and attributes are never interpreted.
function appendInline(parent, text) {
  const tokens = /\*\*([^*\n]+)\*\*|\*([^*\n]+)\*|`([^`\n]+)`/g;
  let start = 0;
  for (const match of text.matchAll(tokens)) {
    parent.append(document.createTextNode(text.slice(start, match.index)));
    const node = document.createElement(match[1] !== undefined ? 'strong' : match[2] !== undefined ? 'em' : 'code');
    node.textContent = match[1] ?? match[2] ?? match[3];
    parent.append(node);
    start = match.index + match[0].length;
  }
  parent.append(document.createTextNode(text.slice(start)));
}

export function renderArticleContent(content) {
  const fragment = document.createDocumentFragment();
  let paragraph = [],
    list = null;
  const flush = () => {
    if (paragraph.length) {
      const p = document.createElement('p');
      appendInline(p, paragraph.join(' '));
      fragment.append(p);
      paragraph = [];
    }
  };
  for (const source of String(content).split(/\r?\n/)) {
    const line = source.trim();
    if (!line) {
      flush();
      list = null;
      continue;
    }
    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {
      flush();
      list = null;
      // h2 belongs to the dialog's single article title.
      const h = document.createElement(`h${Math.max(3, heading[1].length + 1)}`);
      appendInline(h, heading[2]);
      fragment.append(h);
      continue;
    }
    const item = /^(?:[-*]\s+|\d+\.\s+)(.+)$/.exec(line);
    if (item) {
      flush();
      const type = /^\d+\./.test(line) ? 'ol' : 'ul';
      if (!list || list.localName !== type) {
        list = document.createElement(type);
        fragment.append(list);
      }
      const li = document.createElement('li');
      appendInline(li, item[1]);
      list.append(li);
      continue;
    }
    list = null;
    paragraph.push(line);
  }
  flush();
  return fragment;
}
