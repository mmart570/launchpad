import { useState } from 'react'
import { Link } from 'react-router-dom'
import '../styles/ForgotPassword.css'

function ForgotPassword() {
  // Keep the email request and password update forms independent.
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [forgotNotice, setForgotNotice] = useState('')
  const [resetNotice, setResetNotice] = useState('')

  // Show backend connection status after requesting a recovery email.
  function handleForgotSubmit(event) {
    event.preventDefault()

    // Connect this to your backend's password-reset email endpoint later.
    setForgotNotice(
      'Password reset emails are not connected to the backend yet.',
    )
  }

  // Check password requirements before reporting the pending backend integration.
  function handleResetSubmit(event) {
    event.preventDefault()

    if (newPassword.length < 8) {
      setResetNotice('Password must be at least 8 characters.')
      return
    }

    if (newPassword !== confirmPassword) {
      setResetNotice('Passwords do not match.')
      return
    }

    // A real reset must also verify a secure, unexpired reset token.
    setResetNotice(
      'Password resetting is not connected to the backend yet.',
    )
  }

  return (
    // Present the email request and password update as separate recovery steps.
    <main className="password-recovery-page">
      <div className="password-recovery-grid">
        {/* Collect an email address to request a reset link. */}
        <section className="password-recovery-section">
          <h2 className="password-recovery-step">1. Forgot password</h2>

          <div className="password-recovery-card">
            <h1>Forgot your password?</h1>

            <p className="password-recovery-description">
              Enter your email and we will send a reset link.
            </p>

            {forgotNotice && (
              <div className="password-recovery-notice" role="status">
                {forgotNotice}
              </div>
            )}

            <form onSubmit={handleForgotSubmit}>
              <div className="password-recovery-field">
                <label htmlFor="forgot-email">Email</label>
                <input
                  id="forgot-email"
                  type="email"
                  placeholder="[you@email.com]"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <button type="submit" className="password-recovery-button">
                Send reset link
              </button>
            </form>

            <Link to="/login" className="password-recovery-back">
              Back to log in
            </Link>
          </div>
        </section>

        {/* Provide the follow-up form for choosing and confirming a password. */}
        <section className="password-recovery-section">
          <h2 className="password-recovery-step">2. Reset password</h2>

          <div className="password-recovery-card">
            <h1>Set a new password</h1>

            <p className="password-recovery-description">
              [Password requirements go here.]
            </p>

            {resetNotice && (
              <div className="password-recovery-notice" role="status">
                {resetNotice}
              </div>
            )}

            <form onSubmit={handleResetSubmit}>
              <div className="password-recovery-field">
                <label htmlFor="new-password">New password</label>
                <input
                  id="new-password"
                  type="password"
                  placeholder="[New password]"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>

              <div className="password-recovery-field">
                <label htmlFor="confirm-password">Confirm password</label>
                <input
                  id="confirm-password"
                  type="password"
                  placeholder="[Confirm password]"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>

              <button type="submit" className="password-recovery-button">
                Reset password
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  )
}

export default ForgotPassword