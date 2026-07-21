function removeTopLevelAncestor(body: HTMLElement, element: Element) {
  let current = element
  while (current.parentElement && current.parentElement !== body) {
    current = current.parentElement
  }
  current.remove()
}

export function filterGhostContentHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html')

  doc.body.querySelectorAll('img[src*="thanks-for-reading"]')
    .forEach(img => removeTopLevelAncestor(doc.body, img))

  doc.body.querySelectorAll('a[href*="#/portal"]')
    .forEach(link => removeTopLevelAncestor(doc.body, link))

  doc.body.querySelectorAll('a').forEach(link => {
    link.setAttribute('target', '_blank')
    link.setAttribute('rel', 'noopener noreferrer')
  })

  return doc.body.innerHTML
}
