import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function Greeting() {
  const [name, setName] = useState('')

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Usa user_metadata si está definido
        const fullName = user.user_metadata?.full_name || user.email
        setName(fullName)
      }
    }

    fetchUser()
  }, [])

  return (
    <h2>Bienvenido, Profesor {name}</h2>
  )
}
