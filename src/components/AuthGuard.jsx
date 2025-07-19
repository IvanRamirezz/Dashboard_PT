import { useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function AuthGuard({ children }) {
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        window.location.href = '/Dashboard_PT'
      }
    }

    checkSession()
  }, [])

  return children
}
