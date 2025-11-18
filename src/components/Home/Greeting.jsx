import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function Greeting() {
  const [email, setEmail] = useState('')

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error) {
        console.error('Error al obtener usuario:', error)
        return
      }

      if (user) {
        setEmail(user.email)  // 👈 aquí obtenemos el email del usuario autenticado
      } else {
        console.log('No hay usuario autenticado')
      }
    }

    fetchUser()
  }, [])

  return (
    <h2>Bienvenido, Profesor {email}</h2>
  )
}
