'use client';
import Link from "next/link";
import { usePathname } from 'next/navigation';


export default function Navbar(){

    const pathname = usePathname();
    const isActive = (path: string) => pathname === path;
    
    return(
        <nav className="bg-teal-950 text-olive-400 px-6 py-4 flex justify-between items-center  shadow-md">
            <div className="flex-1">
                <Link href="/" className="text-xl font-bold tracking-wider text-yellow-300 hover:text-olive-400 transition-colors">Onboard Employee
                </Link>
            </div>
            <div className="flex gap-12 text-sm font-medium justify-center flex-1">
                <Link href="/hr" 
                className={isActive('/hr') ? "font-bold text-yellow-300" : "hover:text-gray-300"}
                    >HR
                </Link>
               
                <Link href="/manager" 
                className={isActive('/manager') ? "font-bold text-yellow-300" : "hover:text-gray-300"}
                >
                    Manager
                </Link>

                <Link href="/finance" 
                className={isActive('/finance') ? "font-bold text-yellow-300" : "hover:text-gray-300"}
                    >
                    Finance
                </Link>

                <Link href="/it" 
                className={isActive('/it') ? "font-bold text-yellow-300" : "hover:text-gray-300"}
                    >
                    IT
                </Link>
            </div>
        </nav>
    );
}