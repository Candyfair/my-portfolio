export interface SocialLink {
  label: string
  displayUrl: string
  href: string
}

export const BLOG_LINK: SocialLink = {
  label: 'Blog',
  displayUrl: 'candygetshandy.com',
  href: 'https://candygetshandy.com',
}

export const GITHUB_LINK: SocialLink = {
  label: 'GitHub',
  displayUrl: 'github.com/Candyfair',
  href: 'https://github.com/Candyfair',
}

export const LINKEDIN_LINK: SocialLink = {
  label: 'LinkedIn',
  displayUrl: 'linkedin.com/in/candicebfairand/',
  href: 'https://linkedin.com/in/candicebfairand/',
}

export const INSTAGRAM_LINK: SocialLink = {
  label: 'Instagram',
  displayUrl: 'instagram.com/candy.fair',
  href: 'https://instagram.com/candy.fair',
}

export const SOCIALS_CONTENT: SocialLink[] = [
  BLOG_LINK,

  GITHUB_LINK,

  LINKEDIN_LINK,

  INSTAGRAM_LINK,
]
