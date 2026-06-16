import { AtSignIcon, EyeIcon, EyeOffIcon, LockIcon, MailIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAppContext } from "../context/AppContext"
import { Toaster } from "react-hot-toast"


const Login = () => {

  const [state,setState] = useState('signup')
  const [username,setUsername] = useState('')
  const [email,setEmail] = useState('')
  const [password,setPassword] = useState('')
  const [showPassword,setShowPassword] = useState(true)
  const [isSubmitting,setisSubmitting] = useState(false)
  const navigate = useNavigate()
  const {login, signup, user} = useAppContext()
  const handleSubmit = async(e: React.FormEvent) => 
  {
    e.preventDefault()
    setisSubmitting(true)
    if(state === 'login')
    {
      await login({email, password})
    }
    else
    {
      await signup({username, email, password})
    }
    setisSubmitting(false)
  }
  useEffect(() => {
    if(user){
      navigate('/')
    }
  }, [user, navigate])

  return (
    <>
     <Toaster />
      <main className="login-page-container">
        <form onSubmit={handleSubmit} className="login-form">
          <h2 className="text-3xl font-medium text-gray-900 dark: text-white">
            {state === 'login' ? "Login" : "SignUp"}
          </h2>
          <p className="mt-2 text-sm text-gray-500/90 dark:test-gray-400">
            {state === 'login'? 'PLease enter email and password to login' : 'Please enter your details to create an account'}
          </p>
          {/*Username*/}
          {state != 'login' && (
              <div className="mt-4">
                <label className="font-medium text-sm text-grey-700 dark: text-gray-300">Username</label>
                <div className="relative mt-2">
                  <AtSignIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-4.5"/>
                  <input onChange={(e) => setUsername(e.target.value)} value={username}
                   type="text" placeholder="enter a username" className="login-input" required />
                </div>
              </div>
          )}  
          {/*Email*/}
          <div className="mt-4">
                <label className="font-medium text-sm text-grey-700 dark: text-gray-300">Email</label>
                <div className="relative mt-2">
                  <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-4.5"/>
                  <input onChange={(e) => setEmail(e.target.value)} value={email}
                   type="email" placeholder="Please enter your email" className="login-input" required />
                </div>
              </div>

              {/*Password*/}
          <div className="mt-4">
                <label className="font-medium text-sm text-grey-700 dark: text-gray-300">Password</label>
                <div className="relative mt-2">
                  <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-4.5"/>
                  <input onChange={(e) => setPassword(e.target.value)} value={password}
                   placeholder="Please enter your password" className="login-input pr-10" required
                   type={showPassword? 'password' : 'text'} />
                   <button type="button"  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover : text-gray-600"
                   onClick={() => setShowPassword((p) => !p)}>
                     {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16}/>}
                   </button>
                </div>
              </div>

              <button type="submit" disabled={isSubmitting} className="login-button">
                {isSubmitting? "Signing in..." : state === "login"? 'Login' : 'Sign Up'}
              </button>

            {state === 'login'
              ?(
                <p className="text-center py-6 text-sm text-gray-500 dark:text-gray-400">Don't have an account? <button onClick={() => setState('signup')} className="ml-1 cursor-pointer text-green-600 hover:underline">Sign Up</button></p>
              ) : (
                <p className="text-center py-6 text-sm text-gray-500 dark:text-gray-400">Already have an account? <button onClick={() => setState('login')} className="ml-1 cursor-pointer text-green-600 hover:underline">Login</button></p>
              )}
        </form>
         
      </main>

    </>
  )
}

export default Login