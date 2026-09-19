import { useState } from 'react'
import { useAuth } from '@/app/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      await login(username, password)
      navigate('/')
    } catch {
      setError('Identifiants incorrects.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      <section className="hidden lg:flex lg:w-5/12 xl:w-1/2 bg-inverse-surface text-inverse-on-surface flex-col justify-between p-16">
        <div>
          <div className="flex items-center gap-3.5 mb-12">
            <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center">
              <svg className="w-7 h-7 text-on-primary" fill="none" stroke="currentColor" viewBox="0 0 42 42">
                <path d="M7 21h7l3.5-9 6 18 5-13 3.5 4h7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.2" />
              </svg>
            </div>
            <div>
              <span className="block text-2xl font-black tracking-tight">SIM-BIOMED</span>
              <span className="block text-[10px] font-semibold tracking-wider text-surface-dim mt-1 uppercase">
                Système Intelligent de Maintenance Biomédicale
              </span>
            </div>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight leading-tight">
            Des équipements en bon état,{' '}
            <span className="text-primary">des soins de meilleure qualité.</span>
          </h1>
        </div>
      </section>

      <section className="lg:w-7/12 xl:w-1/2 bg-surface flex flex-col justify-between p-12 overflow-y-auto">
        <div className="w-full max-w-xl mx-auto my-auto">
          <div className="mb-6 bg-primary/5 border-l-4 border-primary p-4 rounded-r-lg">
            <p className="text-xs text-on-surface font-medium">
              <strong className="font-semibold text-on-surface">Accès restreint :</strong>{' '}
              Réservé au personnel habilité des services biomédicaux et soignants.
            </p>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-on-surface">Se connecter</h2>
            <p className="text-sm text-on-surface-variant mt-1">
              Accédez à votre espace SIM-BIOMED.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-error-container text-on-error-container p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Identifiant
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-outline rounded-lg bg-surface-container-lowest text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="Votre identifiant"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-outline rounded-lg bg-surface-container-lowest text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="••••••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-lg text-sm font-bold text-on-primary bg-primary hover:bg-primary-container focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all disabled:opacity-50"
            >
              {isLoading ? 'Connexion...' : 'Se connecter à SIM-BIOMED'}
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}
