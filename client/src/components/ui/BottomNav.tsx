import { HomeIcon, UtensilsIcon, ActivityIcon, UserIcon, MoonIcon, SunIcon } from "lucide-react"
import { NavLink } from "react-router-dom"
import { useTheme } from "../../context/ThemeContext"


const BottomNav = () => {


    const navItems = [
        {path: '/' , label: 'Home', icon: HomeIcon},
        {path: '/food' , label: 'Food', icon: UtensilsIcon},
        {path: '/activity' , label: 'Activity', icon: ActivityIcon},
        {path: '/profile' , label: 'Profile', icon: UserIcon},
    ]
const {theme, toogleTheme} = useTheme()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-4 pb-safe lg:hidden transition-colors duration-200">
        <div className="max-w-lg mx-auto flex justify-around items-center h-16">
            {navItems.map((item) => (
                <NavLink key={item.path} to={item.path} className={({isActive}) => `flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200 ${isActive? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}>
                    <item.icon className="size-5.5"/>
                    <span className="text-xs font-medium">{item.label}</span>  
                </NavLink>
            ))} 

            <button onClick={toogleTheme}
                className="flex bottom-2.5 right-4 p-3 rounded-full bg-emerald-600 text-white shadow-lg hover:scale-105 transitional">
                {theme === 'light'? <MoonIcon className="size-5.5"/> : <SunIcon className="size-5.5"/>}
                
            </button>
            
        </div>       
        
    </nav>
  )
}

export default BottomNav