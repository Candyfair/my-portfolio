import { useEffect, useState } from 'react'
import type { ChangeEvent, CSSProperties, FormEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CONTACT_CONTENT, CONTACT_FALLBACK_EMAIL } from '../data/contactContent'
import { PanelHeader } from './PanelHeader'

// Replace with the real Web3Forms access key before deploying
const WEB3FORMS_ACCESS_KEY = '67704ed4-8f5a-40cf-a5d9-fb632bc35edf'
const WEB3FORMS_SUBMIT_URL = 'https://api.web3forms.com/submit'

// Native minLength validation on the message field
const CONTACT_MESSAGE_MIN_LENGTH = 10
// Fade in/out duration of the success toast
const CONTACT_TOAST_FADE_DURATION_MS = 300
// How long the success toast stays visible before auto-dismissing (resets status to idle)
const CONTACT_TOAST_DISPLAY_DURATION_MS = 5000

type ContactStatus = 'idle' | 'sending' | 'success' | 'error'

const wrapperStyle: CSSProperties = {
  position: 'relative',
}

const fieldWrapperStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  marginBottom: '12px',
}

const inputStyle: CSSProperties = {
  border: '1px solid var(--color-fg)',
  background: 'transparent',
  color: 'var(--color-fg)',
  font: 'inherit',
  padding: '6px 8px',
  width: '100%',
}

// Same visual style as the skills overlay cards (SkillsOverlay.tsx), reused as-is.
// Positioned as an overlay on top of the form (not above the panel box) so it
// stays within the panel's overflowY/clip-path bounds — see ContentPanel.tsx.
const toastStyle: CSSProperties = {
  position: 'absolute',
  top: '8px',
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 1,
  width: 'max-content',
  maxWidth: '60%',
  fontFamily: 'inherit',
  fontSize: '11px',
  color: 'var(--color-fg)',
  background: 'var(--color-bg)',
  border: '1px solid var(--color-fg)',
  boxShadow: `0px 0px 25px 3px rgba(0,0,0,0.15)`,
  padding: '6px 10px',
}

function ContactSuccessToast() {
  return (
    <motion.div
      key="contact-success-toast"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: CONTACT_TOAST_FADE_DURATION_MS / 1000 }}
      style={toastStyle}
    >
      {CONTACT_CONTENT.successMessage}
    </motion.div>
  )
}

export function ContactForm() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<ContactStatus>('idle')

  useEffect(() => {
    if (status !== 'success') return
    const timer = setTimeout(() => setStatus('idle'), CONTACT_TOAST_DISPLAY_DURATION_MS)
    return () => clearTimeout(timer)
  }, [status])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    if (!form.reportValidity()) return

    setStatus('sending')
    try {
      const response = await fetch(WEB3FORMS_SUBMIT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_key: WEB3FORMS_ACCESS_KEY, email, message }),
      })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.message ?? 'Submission failed')

      setEmail('')
      setMessage('')
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div style={wrapperStyle}>
      <PanelHeader nodeId="contact" />

      <AnimatePresence>
        {status === 'success' && <ContactSuccessToast />}
      </AnimatePresence>

      <form onSubmit={handleSubmit} noValidate>
        <p>{CONTACT_CONTENT.intro}</p>

        <div style={fieldWrapperStyle}>
          <label htmlFor="contact-email">{CONTACT_CONTENT.emailLabel}</label>
          <input
            id="contact-email"
            type="email"
            required
            value={email}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div style={fieldWrapperStyle}>
          <label htmlFor="contact-message">{CONTACT_CONTENT.messageLabel}</label>
          <textarea
            id="contact-message"
            required
            minLength={CONTACT_MESSAGE_MIN_LENGTH}
            rows={5}
            value={message}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
            style={inputStyle}
          />
        </div>

        <button
          type="submit"
          disabled={status === 'sending'}
          style={{
            border: '1px solid var(--color-fg)',
            padding: '6px 14px',
            background: 'transparent',
            color: 'var(--color-fg)',
            font: 'inherit',
            cursor: status === 'sending' ? 'not-allowed' : 'pointer',
          }}
        >
          {status === 'sending' ? CONTACT_CONTENT.sendingLabel : CONTACT_CONTENT.sendLabel}
        </button>

        {status === 'error' && (
          <p style={{ color: 'var(--color-error)' }}>
            {CONTACT_CONTENT.errorMessagePrefix}{' '}
            <a href={`mailto:${CONTACT_FALLBACK_EMAIL}`} style={{ color: 'var(--color-error)' }}>
              {CONTACT_FALLBACK_EMAIL}
            </a>
            .
          </p>
        )}
      </form>
    </div>
  )
}
