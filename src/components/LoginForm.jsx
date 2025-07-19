import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) setError(error.message)
    else window.location.href = '/Dashboard_PT/Dashboard'
  }

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <label>
        <span>Correo electrónico</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </label>

      <label>
        <span>Contraseña</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </label>

      <button type="submit">Entrar</button>

      {error && <p className="login-error">{error}</p>}
    </form>
  )
}
